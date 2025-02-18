const log = require('logging').default('Frontend');
const express = require('express');

const app = express.Router();

const db = require('./db');

app.get('/', async (req, res) => {
    const images = await db.Image.countDocuments({ status: 'public' });
    const today = new Date().toISOString().split('T')[0];
    let todaysViews = await db.DailyStats.findOne({
        date: today
    });
    if (!todaysViews) {
        todaysViews = new db.DailyStats({
            date: today
        });
        await todaysViews.save();
    }

    res.send(`<h1>Landing</h1><a href="/upload">Upload</a><hr />Images: ${images} | Views: ${todaysViews.totalViews}`);
});

app.get('/upload', (req, res) => {
    res.render('upload');
});

app.get('/auth', (req, res) => {
    res.render('auth');
});


module.exports = app;