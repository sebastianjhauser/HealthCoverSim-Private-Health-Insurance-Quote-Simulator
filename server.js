const express = require('express');
const quoteRoutes = require('./routes/quotes');

const app = express();

// Without this, Express won't parse JSON request bodies - req.body would
// be undefined for every POST/PUT request from the frontend.
app.use(express.json());

// Any request to /api/quotes/... gets handled by the routes defined
// in routes/quotes.js (the actual GET/POST/PUT/DELETE logic).
app.use('/api/quotes', quoteRoutes);

// Render (and most hosts) set PORT themselves in production. 3001 is
// just the fallback used when running locally.
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`HealthCoverSim API running on http://localhost:${PORT}`);
});