const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const { database, TABLES } = require('./database');
const { dateFormat } = require('./util');

const { OPENAI_ENDPOINT, OPENAI_API_KEY, IS_PRIVATE } = require('./config');

const client = new OpenAIClient(OPENAI_ENDPOINT, new AzureKeyCredential(OPENAI_API_KEY));

const getChatCompletions = async (msg) => {
  const { chat: { id: chatId }, from: { id: uerId, username }, message_id: messageId, text } = msg;
  const tableName = IS_PRIVATE ? `${TABLES.CHAT}_${uerId}` : TABLES.CHAT;
  const historyMessages = await database.findAll(tableName, ['role, content', 'reply'], `${IS_PRIVATE ? '' : `uerId = ${uerId}`}`, [], 'ORDER BY id DESC LIMIT 10');

  const messages = [];
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    const { role, content, reply } = historyMessages[i];
    messages.push({ role, content });
    messages.push({ role: 'assistant', content: reply });
  }
  messages.push({ role: 'user', content: text });

  try {
    const completions = await client.getChatCompletions('gpt-35-turbo', messages, { maxTokens: 4096 });
    const replys = [];
    const gptReplayMessages = [];
    for (const choice of completions.choices) {
      gptReplayMessages.push(choice.message);
      replys.push(choice.message.content);
    }
    console.log(dateFormat(), `reply message: ${JSON.stringify(gptReplayMessages)}`);

    const reply = replys.join('\n');
    await database.insertData(tableName,
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