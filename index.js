const express = require('express');
require('dotenv').config();

const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const PORT = process.env.PORT || 3001;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

//////////////////////////////////////////////////////////////////////////////////////////////

const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
});

redisConnection.on("connect", () => console.log(`Redis connecting...`));
redisConnection.on("ready", () => console.log(`Redis ready!`));
redisConnection.on("error", (e) => console.error(`Redis error:`, e.message));
redisConnection.on("close", () => console.log(`Redis connection closed`));

async function connectRedis() {
  if (redisConnection.status !== "ready") {
    try {
      await redisConnection.connect();
    } catch (e) {
      if (!e.message.includes("already connecting") && !e.message.includes("already connected")) {
        throw e;
      }
    }
  }
  return redisConnection;
}

const chatReceiverQueue = new Queue('chat-receiver-queue', { connection: redisConnection });

//////////////////////////////////////////////////////////////////////////////////////////////

const app = express();
app.use(express.json());

//////////////////////////////////////////////////////////////////////////////////////////////

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

app.post('/instagram', async (req, res) => {
  const entries = req.body.entry || [];

  for (const entry of entries) {
    const timeUTC = entry.time*1000;

    for (const change of entry.changes || []) {
      if (change.field === 'live_comments') {
        const username = change.value?.from?.username;
        const platformId = change.value?.from?.id
          ? `ig.${change.value.from.id}`
          : undefined;
        const text = change.value?.text;
        const platform = "instagram";

        if (username && text && platformId) {
          
          const payload = { 
            timeUTC,
            username,
            platformId,
            text,
            platform,
            nickname: null,
          }

          console.log(payload);

          await chatReceiverQueue.add("instagram-chat", payload);
        }
      }
    }
  }

  res.sendStatus(200);
});

//////////////////////////////////////////////////////////////////////////////////////////////

connectRedis();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
