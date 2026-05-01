const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  movieTitle: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  watched: {
    type: Boolean,
    default: false
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Watchlist', watchlistSchema);
