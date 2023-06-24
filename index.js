const TelegramBot = require('node-telegram-bot-api');
const { dateFormat } = require('./util');

const { getChatCompletions } = require('./chat');

const dotenv = require('dotenv');
dotenv.config();

const token = process.env.TOKEN;
if (!token) throw new Error('TOKEN is not defined');

const authUserIdsStr = process.env.AUTH_USER_IDS;
const authUserIds = [];
if (authUserIdsStr) {
  authUserIds.push(...authUserIdsStr.split(',').map((id) => parseInt(id)).filter((id) => !isNaN(id)));
}

const bot = new TelegramBot(token, {
  polling: true,
  request: {
    proxy: process.env.PROXY || null,
  },
});

const hanlderTextMessage = async (msg) => {
  const chatId = msg.chat.id;
  const { text, sticker, photo } = msg;
  if (text) {
    const { isSuccess, error, data } = await getChatCompletions(msg);
    if (isSuccess) {
      bot.sendMessage(chatId, data);
    } else {
      bot.sendMessage(chatId, '调用Azure OpenAI API失败.' + error.message);
    }
  } else {
    bot.sendMessage(chatId, '暂时不支持非文本消息');
  }
};

bot.on('message', async (msg) => {
  console.log(dateFormat(), `receive message: ${JSON.stringify(msg)}`)
  const chatId = msg.chat.id;
  if (authUserIds.length !== 0 && !authUserIds.includes(msg.from.id)) {
    return bot.sendMessage(chatId, '你没有权限使用此私人机器人');
  } else {
    hanlderTextMessage(msg);
  }
});

bot.on('channel_post', (msg) => {
  hanlderTextMessage(msg);
});

bot.on('polling_error', (error) => {
  console.log(error);
});

bot.on('webhook_error', (error) => {
  console.log(error);
});

bot.on('error', (error) => {
  console.log(error);
})