const log = require('logging').default('Frontend');
const express = require('express');

const app = express.Router();

const db = require('./db');

app.get('/', async (req, res) => {
    const images = await db.Image.countDocuments({ status: 'public' });
})

module.exports = app;