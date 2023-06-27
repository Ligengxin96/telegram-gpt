const TelegramBot = require('node-telegram-bot-api');
const { dateFormat } = require('./util');
const { TOKEN, PROXY, IS_PRIVATE, AUTH_USER_IDS, TIPS } = require('./config');

const { processTextMessage } = require('./chat');

const bot = new TelegramBot(TOKEN, {
  polling: true,
  request: {
    proxy: PROXY || null,
  },
});

const hanlderTextMessage = async (msg) => {
  const chatId = msg.chat.id;
  const { text, from: { language_code: languageCode }, sticker, photo } = msg;
  if (text) {
    const timeout = setTimeout(() => {
      bot.sendMessage(chatId, TIPS.Wating[languageCode]);
    }, 10 * 1000);
    const [{ isSuccess, error, data }] = await Promise.all([processTextMessage(msg), bot.sendChatAction(chatId, 'typing')]);
    clearTimeout(timeout);
    if (isSuccess) {
      bot.sendMessage(chatId, data);
    } else {
      bot.sendMessage(chatId, `${TIPS.GPTAPIError[languageCode]}. Error: ${error.message || error.error.message}`);
    }
  } else {
    bot.sendMessage(chatId, TIPS.ContentNotSupported[languageCode]);
  }
};

bot.on('message', async (msg) => {
  console.log(dateFormat(), `receive message: ${JSON.stringify(msg)}`)
  const { chat: { id: chatId }, from: { language_code: languageCode } } = msg;
  if (IS_PRIVATE && !AUTH_USER_IDS.includes(msg.from.id)) {
    console.warn(dateFormat(), `${msg.from.id} is not in white list`);
    return bot.sendMessage(chatId, TIPS.UnAuthorized[languageCode]);
  } else {
    hanlderTextMessage(msg);
  }
});

bot.on('polling_error', (error) => {
  console.error(dateFormat(), error);
});

bot.on('webhook_error', (error) => {
  console.error(dateFormat(), error);
});

bot.on('error', (error) => {
  console.error(dateFormat(), error);
});

console.log(dateFormat(), 'Bot is Started');
