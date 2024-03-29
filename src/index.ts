import express from 'express';
import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { createServer } from 'http';
import { getRandomNumber, isBot, isValid } from './util';
import dotenv from 'dotenv';
import { createLogger, transports } from 'winston';
import { VALID_KEYWORD } from './const';
import axios from 'axios';

const app = express();

dotenv.config();

const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.File({ level: 'error', filename: './logs/error.log' }),
    new transports.File({ filename: './logs/combined.log' }),
  ],
});

const PORT = process.env.PORT || 3000;
const slackEvents = createEventAdapter(process.env.SIGNING_SECRET_TICTOC);
const webClient = new WebClient(process.env.BOT_USER_OAUTH_ACCESS_TOKEN_TICTOC);

const createError = () => {
  console.log('run error');
  throw new Error('___error___');
};

slackEvents.on('message', async (e) => {
  console.log('');
  console.log('==== on message ====');
  console.log('');
  try {
    const { text, channel, bot_id, subtype } = e;

    if (subtype === 'message_changed') {
      return console.log('===== subtype =====');
    }
    if (!text) {
      return console.log('=== !text ===');
    }

    const keyword = isValid(text, VALID_KEYWORD);
    const bot = isBot(bot_id);

    if (bot) {
      return console.log('=== bot ===');
    }
    if (keyword) {
      getNotionData(text, channel);
      return;
    }
    if (!keyword) {
      webClient.chat.postMessage({
        text: `hint: 밥, 뭐먹지, 점심, 점심뭐먹지, 배고파`,
        channel: channel,
      });
      return console.log('=== !keyword ===');
    }
    return console.log('=== try ===');
  } catch (error) {
    throw new Error(error.message);
  }
});

const getNotionData = (text, channel) => {
  axios({
    method: 'POST',
    url: 'https://api.notion.com/v1/databases/f1ee04673b2a424aadd87cd4f3b9c014/query',
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': `2021-08-16`,
    },
    data: {
      filter: {
        property: 'Name',
        text: {
          contains: '',
        },
      },
    },
  }).then((res) => {
    const dataList = res.data.results
      .map(({ properties }) => {
        if (!properties.Name.title.length) return null;
        return {
          store: properties.Name.title[0].plain_text,
          path: properties.path.rich_text[0].href,
        };
      })
      .filter((data) => data);
    const idx = getRandomNumber(dataList);
    const { store, path } = dataList[idx];
    webClient.chat.postMessage({
      text: `오늘은 ${store} 어때요?\r${path}`,
      channel: channel,
      mrkdwn: true,
    });
    return console.log('===== postMessage =====');
  });
};

app.use('/slack/events', slackEvents.requestListener());

createServer(app).listen(PORT, () => {
  console.log(`momoguzi starts on ${PORT}`);
});
