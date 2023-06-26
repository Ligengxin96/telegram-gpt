const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const { database, TABLES } = require('./database');
const { dateFormat } = require('./util');

const { OPENAI_ENDPOINT, OPENAI_API_KEY, IS_PRIVATE, COMMANDS, COMMANDSLIST } = require('./config');

const client = new OpenAIClient(OPENAI_ENDPOINT, new AzureKeyCredential(OPENAI_API_KEY));

const getChatCompletions = async (msg) => {
  const { entities, chat: { id: chatId }, from: { id: uerId, username }, message_id: messageId, text } = msg;

  let message = text;
  let isNewChat = false;
  let command = '';
  if (entities && entities[0].type === 'bot_command') {
    const { offset, length } = entities[0];
    command = text.substr(offset, length).trim();
    message = text.substr(offset + length).trim();
    switch (command) {
      case COMMANDS.NEW:
        isNewChat = true;
        break;
      default: {
        return { isSuccess: false, error: new Error(`Command ${command} is not supported. Please use ${COMMANDSLIST}`) };
      }
    }
  }

  const messages = [];
  const tableName = IS_PRIVATE ? `${TABLES.CHAT}_${uerId}` : TABLES.CHAT;
  if (!isNewChat) {
    const historyMessages = await database.findAll(tableName, ['role, content', 'reply', 'command'], `${IS_PRIVATE ? '' : `uerId = ${uerId}`}`, [], 'ORDER BY id DESC LIMIT 10');
    for (let i = historyMessages.length - 1; i >= 0; i--) {
      const { role, content, reply, command } = historyMessages[i];
      if (command === COMMANDS.NEW) {
        messages.length = 0;
      };
      messages.push({ role, content });
      messages.push({ role: 'assistant', content: reply });
    }
  }
  messages.push({ role: 'user', content: message });

  try {
    const completions = await client.getChatCompletions('gpt-35-turbo', messages, { maxTokens: 8192 });
    const replys = [];
    const gptReplayMessages = [];
    for (const choice of completions.choices) {
      gptReplayMessages.push(choice.message);
      replys.push(choice.message.content);
    }
    console.log(dateFormat(), `reply message: ${JSON.stringify(gptReplayMessages)}`);

    const reply = replys.join('\n');
    await database.insertData(tableName,
      ['chatId', 'uerId', 'username', 'messageId', 'role', 'content', 'reply', 'command'],
      database.dataPrepare({ chatId, uerId, username, messageId, role: 'user', content: text, reply, command })
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