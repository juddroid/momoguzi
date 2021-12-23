import express from 'express';
import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { createServer } from 'http';
import { getListFromJSON, getRandomNumber, isBot, isValid } from './util';
import { VALID_KEYWORD } from './const';
import DATA from './data.json';
import dotenv from 'dotenv';
import { createLogger, transports } from 'winston';

const app = express();
const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.File({ level: 'error', filename: './logs/error.log' }),
    new transports.File({ filename: './logs/combined.log' }),
  ],
});
dotenv.config();
const PORT = process.env.PORT || 3000;
const slackEvents = createEventAdapter(process.env.SIGNING_SECRET);
const webClient = new WebClient(process.env.BOT_USER_OAUTH_ACCESS_TOKEN);

const createError = () => {
  console.log('run error');
  throw new Error('___error___');
};

slackEvents.on('message', async (e) => {
  try {
    const { text, channel, bot_id } = e;
    if (!text) return;

    const keyword = isValid(text, VALID_KEYWORD);
    const bot = isBot(bot_id);

    if (bot) return;
    if (keyword) {
      const list = getListFromJSON(DATA.lunch);
      const idx = getRandomNumber(list);
      const { store, path } = list[idx];

      webClient.chat.postMessage({
        text: `오늘은 ${store} 어때요?\r${path}`,
        channel: channel,
      });
      return;
    }
    if (!keyword) {
      webClient.chat.postMessage({
        text: `hint: 밥, 뭐먹지, 점심, 점심뭐먹지, 배고파`,
        channel: channel,
      });
      return;
    }
    logger.info(e);
  } catch (error) {
    logger.error(error.message);
  }
});

// app.post('/slack/events', (req, res) => {
//   console.log(req.body);
//   res.json(req.body);
// });

app.use('/slack/events', slackEvents.requestListener());

createServer(app).listen(PORT, () => {
  console.log(`momoguzi starts on ${PORT}`);
});
