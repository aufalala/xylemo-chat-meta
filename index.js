const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const app = express();

app.use(bodyParser.json());

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        console.log('Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', (req, res) => {
    console.log('Webhook payload:', JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
