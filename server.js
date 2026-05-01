require('dotenv').config({ path: './do_not_post/.env' });
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const movieRoutes = require('./routes/movies');
const watchlistRoutes = require('./routes/watchlist');

const app = express();
const PORT = process.env.PORT || 3000;

// connect to MongoDB
mongoose.connect(process.env.MONGO_CONNECTION_STRING)
  .then(() => console.log('🐄 Connected to MongoDB!'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

// routes
app.use('/movies', movieRoutes);
app.use('/watchlist', watchlistRoutes);

// home route
app.get('/', (req, res) => {
  res.render('index');
});

app.listen(PORT, () => {
  console.log(`🐄 MOO-vie Cow running on http://localhost:${PORT}`);
});
