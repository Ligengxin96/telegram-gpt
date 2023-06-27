const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const { database, TABLES } = require('./database');
const { dateFormat } = require('./util');

const { OPENAI_ENDPOINT, OPENAI_API_KEY, IS_PRIVATE, COMMANDS, TIPS } = require('./config');

const client = new OpenAIClient(OPENAI_ENDPOINT, new AzureKeyCredential(OPENAI_API_KEY));

const processTextMessage = async (msg) => {
  const { entities, from: { id: uerId, language_code: languageCode }, text } = msg;

  let message = text;
  let isNewChat = false;
  let command = '';
  if (entities && entities[0].type === 'bot_command') {
    const { offset, length } = entities[0];
    command = text.substr(offset, length).trim();
    message = text.substr(offset + length).trim();
    switch (command) {
      case COMMANDS.NEW:
        if (!message) {
          message = TIPS.DefaultEmptyMessage[languageCode];
        }
        isNewChat = true;
        break;
      default: {
        break;
      }
    }
  }

  let messages = [];
  const tableName = IS_PRIVATE ? `${TABLES.CHAT}_${uerId}` : TABLES.CHAT;
  const historyMessages = await database.findAll(tableName, ['role, content', 'reply', 'command'], `${IS_PRIVATE ? '' : `uerId = ${uerId}`}`, [], 'ORDER BY id DESC LIMIT 10');
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    const { role, content, reply, command } = historyMessages[i];
    let message = content;
    if (command === COMMANDS.NEW) {
      message = content.substr(content.indexOf(command) + command.length).trim();
      messages = [];
    };
    messages.push({ role, content: message });
    messages.push({ role: 'assistant', content: reply });
  }
  if (isNewChat) {
    messages = [{ role: 'user', content: message }];
  } else {
    messages.push({ role: 'user', content: message });
  }

  return getChatCompletions(msg, messages, command);
}

const getChatCompletions = async (originMsg, messages, command) => {
  try {
    const { chat: { id: chatId }, from: { id: uerId, username }, message_id: messageId, text } = originMsg;
    const timeout = setTimeout(() => {
      console.warn(dateFormat(), `Get reply timeout. text: ${text}`)
    }, 30 * 1000);
    const completions = await Promise.race([
      client.getChatCompletions('gpt-35-turbo', messages, { maxTokens: 8192 - JSON.stringify(messages).length }),
      new Promise((resolve) => { setTimeout(() => { resolve({ choices: [{ message: { content: 'Get reply timeout.' }, timeout: true }] }) }, 60 * 1000) }),
    ]);
    clearTimeout(timeout);
    const replys = [];
    const gptReplayMessages = [];

    let isTimeout = false;
    for (const choice of completions.choices) {
      if (choice.timeout) {
        isTimeout = true;
      }
      gptReplayMessages.push(choice.message);
      replys.push(choice.message.content);
    }
    console.log(dateFormat(), `reply message: ${JSON.stringify(gptReplayMessages)}`);

    const reply = replys.join('\n');
    const tableName = IS_PRIVATE ? `${TABLES.CHAT}_${uerId}` : TABLES.CHAT;
    await database.insertData(tableName,
      ['chatId', 'uerId', 'username', 'messageId', 'role', 'content', 'reply', 'command'],
      database.dataPrepare({ chatId, uerId, username, messageId, role: 'user', content: text, reply: isTimeout ? '' : reply, command })
    );

    return { isSuccess: true, data: reply };
  } catch (error) {
    console.error(dateFormat(), error);
    return { isSuccess: false, error };
  }
};

module.exports = {
  processTextMessage,
}