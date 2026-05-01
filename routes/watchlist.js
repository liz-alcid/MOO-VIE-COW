const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');

// view watchlist
router.get('/', async (req, res) => {
  try {
    const items = await Watchlist.find().sort({ addedAt: -1 });
    res.render('watchlist', { items });
  
  } catch (err) {
    console.error(err);
    res.render('watchlist', { items: [] });
  }

});

// add to watchlist
router.post('/add', async (req, res) => {
  const { movieTitle, notes } = req.body;
  if (!movieTitle || !movieTitle.trim()) return res.redirect('/watchlist');

  try {
    await Watchlist.create({ movieTitle: movieTitle.trim(), notes: notes || '' });
 
  } catch (err) {
    console.error(err);
  }

  res.redirect('/watchlist');

});

// watched status
router.post('/toggle/:id', async (req, res) => {
  try {
    const item = await Watchlist.findById(req.params.id);
    if (item) {
      item.watched = !item.watched;
      await item.save();
    }
  
  } catch (err) {
    console.error(err);
  }
  res.redirect('/watchlist');

});

// delete from watchlist
router.post('/delete/:id', async (req, res) => {
  try {
    await Watchlist.findByIdAndDelete(req.params.id);
  
  } catch (err) {
    console.error(err);
  }
  res.redirect('/watchlist');

});

module.exports = router;
