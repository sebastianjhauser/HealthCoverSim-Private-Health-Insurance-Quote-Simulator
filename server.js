const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/quotes', require('./routes/quotes'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`HealthCoverSim API running on http://localhost:${PORT}`);
});