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
      bot.sendMessage(chatId, 'Please wait a moment, generating content now...');
    }, 10 * 1000);
    const [{ isSuccess, error, data }] = await Promise.all([getChatCompletions(msg), bot.sendChatAction(chatId, 'typing')]);
    clearTimeout(timeout);
    if (isSuccess) {
      bot.sendMessage(chatId, data);
    } else {
      bot.sendMessage(chatId, `Call Azure OpenAI API failed. Error: ${error.message || error.error.message}`);
    }
  } else {
    bot.sendMessage(chatId, `Non-text messages are currently not supported.`);
  }
};

bot.on('message', async (msg) => {
  console.log(dateFormat(), `receive message: ${JSON.stringify(msg)}`)
  const chatId = msg.chat.id;
  if (IS_PRIVATE && !AUTH_USER_IDS.includes(msg.from.id)) {
    console.warn(dateFormat(), `${msg.from.id} is not in white list`);
    return bot.sendMessage(chatId, `You don't have permission to use this private bot.`);
  } else {
    hanlderTextMessage(msg);
  }
});

bot.on('channel_post', (msg) => {
  hanlderTextMessage(msg);
});

bot.on('polling_error', (error) => {
  console.log(dateFormat(), error);
});

bot.on('webhook_error', (error) => {
  console.log(dateFormat(), error);
});

bot.on('error', (error) => {
  console.log(dateFormat(), error);
});

console.log(dateFormat(), 'Bot is Started');
