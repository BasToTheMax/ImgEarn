const log = require('logging').default('Frontend');
const express = require('express');

const app = express.Router();

const db = require('./db');

app.use('/uploads', express.static(__dirname + '/uploads'));

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

app.get('/dash', (req, res) => {
    res.render('dash');
});

app.get('/image/:id', async (req, res) => {
    try {
        let ip = req.ip;
        const { id } = req.params;
        let img = await db.Image.findById(id);
        if (!img) return res.status(404).render('404');

        let date = new Date().toISOString().split('T')[0];
        let dailyView = await db.DailyImageView.findOne({ image: img._id, date });

        // Image view
        if (!dailyView) {
            dailyView = new db.DailyImageView({
                image: img._id,
                date,
                views: 0
            });
            await dailyView.save();
        }

        let ipData = await db.ViewIP.findOne({ date, ip });
        if (!ipData) {
            dailyView.views++;
            await dailyView.save();
        }

        // Site view
        let siteView = await db.DailyStats.findOne({ date });

        if (!siteView) {
            siteView = new db.DailyStats({
                date,
                totalViews: 0,
                adRevenue: 0
            });
            await siteView.save();
        }

        if (!ipData) await db.DailyStats.findByIdAndUpdate(siteView._id, { $inc: { totalViews: 1 } });

        if (!ipData) {
            ipData = new db.ViewIP({
                ip,
                date,
                image: img._id
            });
            await ipData.save();
        }

        res.render('image', { img, views: dailyView.views });
    } catch (error) {
        console.log(error);
        return res.status(500).send('ERROR! ' + String(error));
    }
});

app.get('/admin', (req, res) => {
    res.render('admin');
});


module.exports = app;