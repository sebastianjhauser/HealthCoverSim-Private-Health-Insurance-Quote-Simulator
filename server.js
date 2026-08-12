const express = require('express');
const quoteRoutes = require('./routes/quotes');

const app = express();

//allow parsing of JSON in requests
app.use(express.json());

//mount the quote routes at /api/quotes
app.use('/api/quotes', quoteRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`HealthCoverSim running on http://localhost:${PORT}`);
});