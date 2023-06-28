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
  },
  ContentNotSupported: {
    [LANGCODE.CNS]: '暂不非文本消息',
    [LANGCODE.CNT]: `暫不支持非文本消息`,
    [LANGCODE.EN]: `Non-text messages are currently not supported.`,
  },
  GPTAPIError: {
    [LANGCODE.CNS]: '调用 Azure OpenAI API 失败',
    [LANGCODE.CNT]: '·調用 Azure OpenAI API 失敗',
    [LANGCODE.EN]: `Call Azure OpenAI API failed`,
  },
  UnAuthorized: {
    [LANGCODE.CNS]: '你没有权限使用此私人机器人',
    [LANGCODE.CNT]: `你沒有權限使用此私人機器人`,
    [LANGCODE.EN]: `You don't have permission to use this private bot.`,
  },
  ReplayTimeout: {
    [LANGCODE.CNS]: '获取回复超时',
    [LANGCODE.CNT]: `獲取回復超時`,
    [LANGCODE.EN]: `Get reply timeout`,
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