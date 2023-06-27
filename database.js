const isArray = require('lodash/isArray');
const isUndefined = require('lodash/isUndefined');
const isObject = require('lodash/isObject');
const Sqlite = require('better-sqlite3');
const fs = require('fs');

const { dateFormat } = require('./util');
const { AUTH_USER_IDS } = require('./config');


const TABLES = {
  CHAT: 'chat',
};

const TABLE_FIELDS = {
  [TABLES.CHAT]: [
    ['id', 'INTEGER PRIMARY KEY AUTOINCREMENT'],
    ['chatId', 'INTEGER'],
    ['uerId', 'INTEGER'],
    ['username', 'INTEGER'],
    ['messageId', 'INTEGER'],
    ['role', 'VARCHAR(10)'],
    ['content', 'TEXT'],
    ['reply', 'TEXT'],
    ['command', 'VARCHAR(10)'],
    ['createdAt', 'DATETIME DEFAULT CURRENT_TIMESTAMP'],
    ['updatedAt', 'DATETIME DEFAULT CURRENT_TIMESTAMP'],
  ],
}

class Database {
  #database;
  constructor(dataFilePath, options = { timeout: 30000 }) {
    this.#database = new Sqlite(dataFilePath, options);
  }

  init() {
    Object.keys(TABLES).forEach((tableName) => {
      this.createTable(tableName, TABLE_FIELDS[TABLES[tableName]]);
      AUTH_USER_IDS.forEach((userId) => {
        this.createTable(`${tableName}_${userId}`, TABLE_FIELDS[TABLES[tableName]]);
      });
    });
  }

  dataPrepare(value) {
    const data = {};
    for (let key in value) {
      if (isUndefined(value[key]))
        data[key] = null;
      else if (isObject(value[key]))
        data[key] = JSON.stringify(value[key]);
      else
        data[key] = value[key];
    }
    return data;
  }

  async createTable(tableName, fields = []) {
    try {
      this.#database.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (${fields.map(field => field.join(" ")).join(",")})`);
    } catch (error) {
      console.error(dateFormat(), error);
    }
  }

  async find(tableName, fields, where, whereDatas) {
    try {
      const fieldsStr = isArray(fields) ? fields.join(",") : (fields || "*");
      const stmt = this.#database.prepare(`SELECT ${fieldsStr} FROM ${tableName} WHERE ${where}`);
      return stmt.get(whereDatas);
    } catch (error) {
      console.error(dateFormat(), error);
    }
  }

  async findAll(tableName, fields, where, whereDatas = [], other, otherDatas = []) {
    try {
      const fieldsStr = isArray(fields) ? fields.join(",") : (fields || "*");
      const stmt = this.#database.prepare(`SELECT ${fieldsStr} FROM ${tableName}${where ? " WHERE " + where : ""}${other ? " " + other : ""}`);
      return stmt.all([...whereDatas, ...otherDatas]);
    } catch (error) {
      console.error(dateFormat(), error);
    }
  }

  async insertData(tableName, fields, data = {}) {
    try {
      const stmt = this.#database.prepare(`INSERT INTO ${tableName} (${fields.join(",")}) VALUES (${fields.map(field => `@${field}`).join(",")})`);
      return stmt.run(data);
    } catch (error) {
      console.error(dateFormat(), error);
    }
  }
}

const databaseDir = './database';
const databaseFilePath = `./${databaseDir}/telegram-GPT.sqlite`;
try {
  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir);
  }

  if (!fs.existsSync(databaseFilePath)) {
    fs.writeFileSync(databaseFilePath, '');
  }
} catch (error) {
  console.error(dateFormat(), `Create database file error: ${error}`);
}

const database = new Database(databaseFilePath);
database.init();
module.exports = {
  database,
  TABLES,
  TABLE_FIELDS,
}