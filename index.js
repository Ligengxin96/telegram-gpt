const TelegramBot = require('node-telegram-bot-api');
const { dateFormat } = require('./util');
const { TOKEN, PROXY, IS_PRIVATE, AUTH_USER_IDS } = require('./config');

const { getChatCompletions } = require('./chat');

const bot = new TelegramBot(TOKEN, {
  polling: true,
  request: {
    proxy: PROXY || null,
  },
});

const hanlderTextMessage = async (msg) => {
  const chatId = msg.chat.id;
  const { text, sticker, photo } = msg;
  if (text) {
    const timeout = setTimeout(() => {
      bot.sendMessage(chatId, '请稍等下，正在生成内容...');
    }, 10 * 1000);
    const [{ isSuccess, error, data }, _] = await Promise.all([getChatCompletions(msg), bot.sendChatAction(chatId, 'typing')]);
    clearTimeout(timeout);
    if (isSuccess) {
      bot.sendMessage(chatId, data);
    } else {
      bot.sendMessage(chatId, 'Call Azure OpenAI API failed. ' + error.message);
    }
  } else {
    bot.sendMessage(chatId, '暂时不支持非文本消息');
  }
};

bot.on('message', async (msg) => {
  console.log(dateFormat(), `receive message: ${JSON.stringify(msg)}`)
  const chatId = msg.chat.id;
  if (IS_PRIVATE && !AUTH_USER_IDS.includes(msg.from.id)) {
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
});