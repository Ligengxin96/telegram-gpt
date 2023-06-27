const dotenv = require('dotenv');
dotenv.config();


const TOKEN = process.env.TOKEN;
if (!TOKEN) throw new Error('No TOKEN environment variable set.');

const OPENAI_ENDPOINT = process.env.OPENAI_ENDPOINT;
if (!OPENAI_ENDPOINT) throw new Error('No OPENAI_ENDPOINT environment variable set.');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error('No OPENAI_API_KEY environment variable set.');

const authUserIdsStr = process.env.AUTH_USER_IDS;
const authUserIds = [];
if (authUserIdsStr) {
  authUserIds.push(...authUserIdsStr.split(',').map((id) => parseInt(id)).filter((id) => !isNaN(id)));
}

const COMMANDSLIST = ['/new'];
const COMMANDS = {
  NEW: COMMANDSLIST[0],
};

const LANGCODE = {
  CNS: 'zh-hans',
  CNT: 'zh-hant',
  EN: 'en',
}

const TIPS = {
  Wating: {
    [LANGCODE.CNS]: '请稍等，正在生成内容...',
    [LANGCODE.CNT]: `請稍等，正在生成內容...`,
    [LANGCODE.EN]: `Please wait a moment, generating content now...`,
  },
  DefaultEmptyMessage: {
    [LANGCODE.CNS]: '你好',
    [LANGCODE.CNT]: '你好',
    [LANGCODE.EN]: 'Hello',
  }
};

module.exports = {
  TOKEN,
  AUTH_USER_IDS: authUserIds,
  IS_PRIVATE: authUserIds.length !== 0,
  PROXY: process.env.PROXY,
  OPENAI_ENDPOINT,
  OPENAI_API_KEY,
  COMMANDS,
  COMMANDSLIST,
  TIPS,
}