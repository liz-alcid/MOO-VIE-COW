const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  movieTitle: {
    type: String,
    required: true,
    trim: true
  },
  foundOn: {
    type: String,
    default: null
  },
  movieId: {
    type: Number,
    default: null
  },
  directUrl: {
    type: String,
    default: null
  },
  searchedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
