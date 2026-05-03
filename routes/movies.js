const express = require('express');
const router = express.Router();
const axios = require('axios');
const SearchHistory = require('../models/SearchHistory');

const API_KEY = process.env.WATCHMODE_API_KEY;
const API_URL = 'https://api.watchmode.com/v1';

const SERVICES = {
  'netflix':        { watchmode_id: 203, search_url: 'https://www.netflix.com/search?q={}' },
  'hulu':           { watchmode_id: 157, search_url: 'https://www.hulu.com/search?q={}' },
  'amazon-prime':   { watchmode_id: 26,  search_url: 'https://www.amazon.com/s?k={}&i=prime-instant-video' },
  'disney-plus':    { watchmode_id: 372, search_url: 'https://www.disneyplus.com/search/{}' },
  'hbo-max':        { watchmode_id: 387, search_url: 'https://www.max.com/' },
  'apple-tv':       { watchmode_id: 371, search_url: 'https://tv.apple.com/search?term={}' },
  'paramount-plus': { watchmode_id: 444, search_url: 'https://www.paramountplus.com/search/?query={}' }
};

const SERVICE_QUEUE = [
  'hbo-max', 'hulu', 'disney-plus', 'amazon-prime',
  'paramount-plus', 'netflix', 'apple-tv'
];

const SERVICE_LABELS = {
  'netflix': 'Netflix',
  'hulu': 'Hulu',
  'amazon-prime': 'Amazon Prime',
  'disney-plus': 'Disney+',
  'hbo-max': 'HBOMax',
  'apple-tv': 'Apple TV+',
  'paramount-plus': 'Paramount+'
};

// search for movie and redirect user
router.post('/search', async (req, res) => {
  const { movieTitle } = req.body;
  if (!movieTitle || !movieTitle.trim()) return res.redirect('/');
 
  try {
    const encoded = encodeURIComponent(movieTitle.trim());
 
    const searchRes = await axios.get(`${API_URL}/search/`, {
      params: { apiKey: API_KEY, search_field: 'name', search_value: movieTitle.trim() }
    });
 
    const results = searchRes.data;
 
    // movie not found in API
    if (!results.title_results || results.title_results.length === 0) {
      await SearchHistory.create({ movieTitle: movieTitle.trim(), foundOn: null });
      return res.render('notfound', { movieTitle: movieTitle.trim() });
    }
 
    const movieId = results.title_results[0].id;
 
    const detailsRes = await axios.get(`${API_URL}/title/${movieId}/details/`, {
      params: { apiKey: API_KEY, append_to_response: 'sources' }
    });
 
    const movieDetails = detailsRes.data;
    const sourceIds = (movieDetails.sources || []).map(s => s.source_id);
 
    // find all available services
    const availableServices = [];

    for (const serviceName of SERVICE_QUEUE) {
      const serviceId = SERVICES[serviceName].watchmode_id;

      if (serviceId && sourceIds.includes(serviceId)) {
        let directUrl = null;

        // Paramount+ links from WatchMode are stale, always use search instead
        if (serviceName !== 'paramount-plus') {
          for (const source of (movieDetails.sources || [])) {
            if (source.source_id === serviceId) {
              directUrl = source.web_url || source.ios_url || source.android_url || null;
              break;
            }
          }
        }
        
        availableServices.push({
          key: serviceName,
          label: SERVICE_LABELS[serviceName] || serviceName,
          url: directUrl || SERVICES[serviceName].search_url.replace('{}', encoded)
        });
      }
    }
 
    // movie exists but isn't on any streaming service
    if (availableServices.length === 0) {
      await SearchHistory.create({ movieTitle: movieTitle.trim(), foundOn: null, movieId });
      return res.render('notfound', { movieTitle: movieTitle.trim() });
    }
 
    // available on only one service — redirect user there
    if (availableServices.length === 1) {
      await SearchHistory.create({
        movieTitle: movieTitle.trim(),
        foundOn: availableServices[0].label,
        movieId,
        directUrl: availableServices[0].url
      });
      
      return res.redirect(availableServices[0].url);
    }
 
    // available on multiple platforms - show picker
    return res.render('picker', {
      movieTitle: movieTitle.trim(),
      movieId,
      availableServices
    });
 
  } catch (err) {
    console.error('Search error:', err.message);
    return res.render('notfound', { movieTitle: req.body.movieTitle || 'that title' });
  }

});
 
// user picked service
router.post('/pick', async (req, res) => {
  const { movieTitle, movieId, serviceLabel, serviceUrl } = req.body;
  
  try {
    await SearchHistory.create({
      movieTitle,
      foundOn: serviceLabel,
      movieId: movieId || null,
      directUrl: serviceUrl
    });
  
  } catch (err) {
    console.error(err);
  }

  return res.redirect(serviceUrl);

});
 
// view search history
router.get('/history', async (req, res) => {
  try {
    const history = await SearchHistory.find().sort({ searchedAt: -1 }).limit(50);
    res.render('history', { history, SERVICE_LABELS });
 
  } catch (err) {
    console.error(err);
    res.render('history', { history: [], SERVICE_LABELS });
  }

});
 
// delete an entry in history
router.post('/history/delete/:id', async (req, res) => {
  try {
    await SearchHistory.findByIdAndDelete(req.params.id);
  
  } catch (err) {
    console.error(err);
  }

  res.redirect('/movies/history');

});
 
module.exports = router;
