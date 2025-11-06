const express = require('express');
require('dotenv').config();
// const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const app = express();

app.use(express.json());

// app.use((req, res, next) => {
//     console.log('--- Incoming Request ---');
//     console.log('Method:', req.method);
//     console.log('URL:', req.url);
//     console.log('Query:', req.query);
//     console.log('Body:', req.body);
//     console.log('------------------------');
//     next();
// });

app.get('/instagram', (req, res) => {
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

app.post('/instagram', (req, res) => {
  const entries = req.body.entry || [];

  entries.forEach(entry => {
    const time = entry.time;

    (entry.changes || []).forEach(change => {
      if (change.field === 'live_comments') {
        const username = change.value?.from?.username;
        const text = change.value?.text;

        if (username && text) {
          console.log(`Time: ${time}, Username: ${username}, Text: ${text}`);
        }
      }
    });
  });

  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
