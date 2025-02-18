require('dotenv').config();

const log = require('logging').default('Main');
const express = require('express');

const env = process.env;
const port = env.port || 3000;

const app = express();

app.use(express.json());
app.set('view engine', 'ejs');

app.use('/api', require('./api'));
app.use(require('./frontend'));

app.listen(port, () => {
    log.info(`App online at port ${port}`);
});