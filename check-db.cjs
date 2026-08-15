const db = require('better-sqlite3')('dev.db');
console.log('Root dev.db tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
db.close();

const db2 = require('better-sqlite3')('prisma/dev.db');
console.log('prisma/dev.db tables:', db2.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
db2.close();
