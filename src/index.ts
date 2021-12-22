import express from 'express';
import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { createServer } from 'http';
import CONFIG from '../config/bot.json';
import { getListFromJSON, getRandomNumber, isValid } from './util';
import { VALID_KEYWORD } from './const';
import DATA from './data.json';

const app = express();
const slackEvents = createEventAdapter(CONFIG.SIGNING_SECRET);
const webClient = new WebClient(CONFIG.BOT_USER_OAUTH_ACCESS_TOKEN);

slackEvents.on('message', async (e) => {
  const { text, channel } = e;

  const keyword = isValid(text, VALID_KEYWORD);

  if (keyword) {
    const list = getListFromJSON(DATA.lunch);
    const idx = getRandomNumber(list);
    const { store, path } = list[idx];

    webClient.chat.postMessage({
      text: `오늘은 ${store} 어때요?\r${path}`,
      channel: channel,
    });
  }
});

app.use('/slack/events', slackEvents.requestListener());

createServer(app).listen(3000, () => {
  console.log('run slack bot');
});
