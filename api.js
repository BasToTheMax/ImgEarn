const log = require('logging').default('API');
const express = require('express');
const md5 = require('md5');
const fs = require('fs');
const sharp = require('sharp');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express.Router();

const db = require('./db');

// Formdata
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp for unique filenames
    }
});

// Multer setup
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif|webp/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'), false);
    }
});

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
    if (req.body && req.body.token) {
        token = req.body.token;
    }
    if (req.query.token) token = req.query.token;


    console.log(req.body);

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

// Get images
app.get('/images', async (req, res) => {
    let images = await db.Image.find({
        user: req.user._id
    });
    res.json(images);
});

app.post('/upload', upload.single('image'), async (req, res) => {
    let { title } = req.body;
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!title) return res.status(400).json({ message: 'No image or title given.' });
    let dbImg = new db.Image({
        user: req.user._id,
        title,
        size: req.file.size
    });
    await dbImg.save();

    console.log(req.file);

    let paths = `${__dirname}/uploads/${dbImg._id}.webp`;
    await sharp(`./${req.file.path}`).webp({
        quality: 75,
        effort: 4
    }).toFile(paths);

    fs.rmSync(`./${req.file.path}`);

    res.json({
        id: dbImg._id
    });
});

module.exports = app;