// All /api/quotes endpoints. This router is mounted at '/api/quotes' in
// server.js, so every path below is RELATIVE to that prefix:
//   router.get('/')     -> GET  /api/quotes
//   router.get('/:id')  -> GET  /api/quotes/:id

const express = require('express');
const router = express.Router();
const db = require('../db');
const {calculateQuote} = require('../pricing');

const HOSPITAL_TIERS = ['None', 'Basic', 'Bronze', 'Silver', 'Gold'];
const EXTRAS_TIERS = ['None', 'Basic', 'Standard', 'Premium'];
const HISTORY_VALUES = ['Yes', 'No', 'Not sure'];
const COVER_TYPES = ['Single', 'Couple', 'Family'];
const FREQUENCIES = ['Monthly', 'Yearly'];

// Checks one quote submission against every rule in spec Section 9.
// Returns an array of error strings — empty array means valid.
// Used by both POST (create) and PUT (update), since both accept the same shape.
function validateQuote(body) {
  const errors = [];

  if (!body.customer_name || !body.customer_name.trim()) {
    errors.push('Customer name is required.');
  }
  if (!COVER_TYPES.includes(body.cover_type)) {
    errors.push('Cover type must be Single, Couple or Family.');
  }
  if (!HOSPITAL_TIERS.includes(body.hospital_cover)) {
    errors.push('Hospital cover must be one of: ' + HOSPITAL_TIERS.join(', '));
  }
  if (!EXTRAS_TIERS.includes(body.extras_cover)) {
    errors.push('Extras cover must be one of: ' + EXTRAS_TIERS.join(', '));
  }
  if (!FREQUENCIES.includes(body.payment_frequency)) {
    errors.push('Payment frequency must be Monthly or Yearly.');
  }

  if (!Number.isFinite(body.applicant1_age) || body.applicant1_age < 18 || body.applicant1_age > 100) {
    errors.push('Applicant 1 age must be between 18 and 100.');
  }
  if (!HISTORY_VALUES.includes(body.applicant1_cover_history)) {
    errors.push('Applicant 1 cover history must be Yes, No or Not sure.');
  }

  if (body.cover_type === 'Couple' || body.cover_type === 'Family') {
    if (!Number.isFinite(body.applicant2_age) || body.applicant2_age < 18 || body.applicant2_age > 100) {
      errors.push('Applicant 2 age is required and must be between 18 and 100 for Couple/Family.');
    }
    if (!HISTORY_VALUES.includes(body.applicant2_cover_history)) {
      errors.push('Applicant 2 cover history is required for Couple/Family.');
    }
  }

  // annual_discount is optional on the request - if it's missing, treat it
  // as 0 for the purposes of this check.
  let discount = body.annual_discount;
  if (discount === undefined) {
    discount = 0;
  }
  if (!Number.isFinite(discount) || discount < 0 || discount > 10) {
    errors.push('Annual discount must be between 0 and 10.');
  }

  return errors;
}

// A few fields are optional depending on cover type (applicant2_*) or just
// optional in general (annual_discount, notes). This turns a request body
// into the exact set of values the database needs, filling in defaults for
// anything missing. Both POST and PUT need this, so it lives in one place
// instead of being copy-pasted into each route.
function buildQuoteValues(body) {
  let applicant2_age = null;
  if (body.applicant2_age !== undefined && body.applicant2_age !== null) {
    applicant2_age = body.applicant2_age;
  }

  let applicant2_cover_history = null;
  if (body.applicant2_cover_history !== undefined && body.applicant2_cover_history !== null) {
    applicant2_cover_history = body.applicant2_cover_history;
  }

  let annual_discount = 0;
  if (body.annual_discount !== undefined && body.annual_discount !== null) {
    annual_discount = body.annual_discount;
  }

  let notes = null;
  if (body.notes !== undefined && body.notes !== null) {
    notes = body.notes;
  }

  return {
    customer_name: body.customer_name,
    cover_type: body.cover_type,
    applicant1_age: body.applicant1_age,
    applicant1_cover_history: body.applicant1_cover_history,
    applicant2_age: applicant2_age,
    applicant2_cover_history: applicant2_cover_history,
    hospital_cover: body.hospital_cover,
    extras_cover: body.extras_cover,
    payment_frequency: body.payment_frequency,
    annual_discount: annual_discount,
    notes: notes,
  };
}

// CREATE  ->  POST /api/quotes
router.post('/', function (req, res) {
  const errors = validateQuote(req.body);
  if (errors.length > 0) {
    return res.status(400).json({errors: errors});
  }

  const values = buildQuoteValues(req.body);

  // The @name placeholders below are matched up against the object's keys
  // (e.g. @customer_name reads values.customer_name) when we call stmt.run().
  const stmt = db.prepare(`
    INSERT INTO quotes (
      customer_name, cover_type, applicant1_age, applicant1_cover_history,
      applicant2_age, applicant2_cover_history, hospital_cover, extras_cover,
      payment_frequency, annual_discount, notes
    ) VALUES (
      @customer_name, @cover_type, @applicant1_age, @applicant1_cover_history,
      @applicant2_age, @applicant2_cover_history, @hospital_cover, @extras_cover,
      @payment_frequency, @annual_discount, @notes
    )
  `);

  const result = stmt.run(values);

  res.status(201).json({id: result.lastInsertRowid});
});

// LIST  ->  GET /api/quotes
router.get('/', function (req, res) {
  const rows = db.prepare('SELECT * FROM quotes ORDER BY id DESC').all();
  res.json(rows);
});

// DETAIL  ->  GET /api/quotes/:id  — the only route that calls pricing.js
router.get('/:id', function (req, res) {
  const row = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({errors: ['Quote not found.']});
  }

  const breakdown = calculateQuote(row);

  // {...row} copies every stored column (customer_name, cover_type, etc.)
  // into a new object, then we add the calculated breakdown alongside them.
  res.json({...row, breakdown: breakdown});
});

// UPDATE  ->  PUT /api/quotes/:id
router.put('/:id', function (req, res) {
  const existing = db.prepare('SELECT id FROM quotes WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({errors: ['Quote not found.']});
  }

  const errors = validateQuote(req.body);
  if (errors.length > 0) {
    return res.status(400).json({errors: errors});
  }

  const values = buildQuoteValues(req.body);
  values.id = req.params.id;

  db.prepare(`
    UPDATE quotes SET
      customer_name = @customer_name,
      cover_type = @cover_type,
      applicant1_age = @applicant1_age,
      applicant1_cover_history = @applicant1_cover_history,
      applicant2_age = @applicant2_age,
      applicant2_cover_history = @applicant2_cover_history,
      hospital_cover = @hospital_cover,
      extras_cover = @extras_cover,
      payment_frequency = @payment_frequency,
      annual_discount = @annual_discount,
      notes = @notes
    WHERE id = @id
  `).run(values);

  res.json({updated: true});
});

// DELETE  ->  DELETE /api/quotes/:id
router.delete('/:id', function (req, res) {
  const result = db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({errors: ['Quote not found.']});
  }
  res.json({deleted: true});
});

module.exports = router;