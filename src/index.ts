import express from 'express';
import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { createServer } from 'http';
import { getListFromJSON, getRandomNumber, isBot, isValid } from './util';
import DATA from './data.json';
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
      // const list = getListFromJSON(DATA.lunch);
      // const idx = getRandomNumber(list);
      // const { store, path } = list[idx];

      // webClient.chat.postMessage({
      //   text: `오늘은 ${store} 어때요?\r${path}`,
      //   channel: channel,
      // });

      getNotionData(keyword, channel);

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

const getNotionData = (keyword, channel) => {
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
    console.log(dataList);
    const idx = getRandomNumber(dataList);
    const { store, path } = dataList[idx];
    webClient.chat.postMessage({
      text: `오늘은 ${store} 어때요?\r${path}\ridx: ${idx}\rkeyword:${keyword}`,
      channel: channel,
    });
  });
};

// app.post('/slack/events', (req, res) => {
//   console.log(req.body);
//   res.json(req.body);
// });

app.use('/slack/events', slackEvents.requestListener());

createServer(app).listen(PORT, () => {
  console.log(`momoguzi starts on ${PORT}`);
});
