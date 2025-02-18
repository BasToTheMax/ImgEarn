const log = require('logging').default('API');
const express = require('express');
const md5 = require('md5');

const app = express.Router();

const db = require('./db');

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'No username or password given.' });
    let user = await db.User.findOne({
        username
    });
    if (!user) return res.status(404).json({ message: 'User does not exist!' });

    if (md5(password) != user.password) return res.status(403).json({ message: 'Invalid password' });

    res.json({ token: user.token });
});

// Register
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'No username or password given.' });
    let user = await db.User.findOne({
        username
    });
    if (user) return res.status(404).json({ message: 'User already exists!' });
 
    user = new db.User({
        username,
        password: md5(password),
        token: Date.now() + '.' + md5(`${username}.${password}`)
    });
    await user.save();

    res.json({ token: user.token });
});

// Require auth
app.use(async (req, res, next) => {
    let token;
    if (req.method == 'GET') {
        token = req.query.token;
    } else {
        token = req.body.token;
    }

    if (!token) return res.status(400).json({ message: 'No token provided.' });

    let user = await db.User.findOne({ token });
    if (!user) return res.status(403).json({ message: 'Invalid token.' });
    
    req.user = user;

    next();
});

// Get balance
app.get('/balance', (req, res) => {
    res.json({ balance: req.user.balance });
});

module.exports = app;