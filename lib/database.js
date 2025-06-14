const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'users.db');
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          reject(err);
        } else {
          this.initializeTables();
          resolve();
        }
      });
    });
  }

  async initializeTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        totp_secret TEXT,
        totp_enabled BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.run(createUsersTable, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async createUser(username, hashedPassword) {
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [username, hashedPassword], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username });
        }
      });
    });
  }

  async getUserByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateTotpSecret(username, totpSecret) {
    const sql = 'UPDATE users SET totp_secret = ?, totp_enabled = TRUE WHERE username = ?';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [totpSecret, username], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  async getUserWithTotp(username) {
    const sql = 'SELECT id, username, password, totp_secret, totp_enabled FROM users WHERE username = ?';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;