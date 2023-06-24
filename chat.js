const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const { database, TABLES } = require('./database');
const { dateFormat } = require('./util');

const dotenv = require('dotenv');
dotenv.config();

const endpoint = process.env.OPENAI_ENDPOINT;
if (!endpoint) throw new Error('No OPENAI_ENDPOINT environment variable set.');
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) throw new Error('No OPENAI_API_KEY environment variable set.');

const client = new OpenAIClient(endpoint, new AzureKeyCredential(openaiKey));

const getChatCompletions = async (msg) => {
  const historyMessages = await database.findAll(TABLES.CHAT, ['role, content', 'reply'], null, [], 'ORDER BY id DESC LIMIT 10');
  const messages = [];
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    const { role, content, reply } = historyMessages[i];
    messages.push({ role, content });
    messages.push({ role: 'assistant', content: reply });
  }
  const { chat: { id: chatId }, from: { id: uerId, username }, message_id: messageId, text } = msg;
  messages.push({ role: 'user', content: text });
  try {
    const completions = await client.getChatCompletions('gpt-35-turbo', messages, { maxTokens: 4096, stop: ['\n'] });
    const reply = completions.choices[0].message.content;
    console.log(dateFormat(), `reply message: ${reply}`)
    await database.insertData(TABLES.CHAT,
      ['chatId', 'uerId', 'username', 'messageId', 'role', 'content', 'reply'],
      database.dataPrepare({ chatId, uerId, username, messageId, role: 'user', content: text, reply })
    );
    return { isSuccess: true, data: reply };
  } catch (error) {
    console.log(dateFormat(), error);
    return { isSuccess: false, error };
  }
};

module.exports = {
  getChatCompletions,
}