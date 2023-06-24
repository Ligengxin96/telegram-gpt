const isArray = require('lodash/isArray');
const isUndefined = require('lodash/isUndefined');
const isObject = require('lodash/isObject');
const Sqlite = require('better-sqlite3');

const { dateFormat } = require('./util');

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
      console.log(dateFormat(), error);
    }
  }

  async find(tableName, fields, where, whereDatas) {
    try {
      const fieldsStr = isArray(fields) ? fields.join(",") : (fields || "*");
      const stmt = this.#database.prepare(`SELECT ${fieldsStr} FROM ${tableName} WHERE ${where}`);
      return stmt.get(whereDatas);
    } catch (error) {
      console.log(dateFormat(), error);
    }
  }

  async findAll(tableName, fields, where, whereDatas = [], other, otherDatas = []) {
    try {
      const fieldsStr = isArray(fields) ? fields.join(",") : (fields || "*");
      const stmt = this.#database.prepare(`SELECT ${fieldsStr} FROM ${tableName}${where ? " WHERE " + where : ""}${other ? " " + other : ""}`);
      return stmt.all([...whereDatas, ...otherDatas]);
    } catch (error) {
      console.log(dateFormat(), error);
    }
  }

  async insertData(tableName, fields, data = {}) {
    try {
      const stmt = this.#database.prepare(`INSERT INTO ${tableName} (${fields.join(",")}) VALUES (${fields.map(field => `@${field}`).join(",")})`);
      return stmt.run(data);
    } catch (error) {
      console.log(dateFormat(), error);
    }
  }
}

const database = new Database('./database/telegram-GPT.sqlite');
database.init();
module.exports = {
  database,
  TABLES,
  TABLE_FIELDS,
}