const dbConfig = process.env.LOCAL_DEV ? require("../config/db.config.local.js") : require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.players = require("./player.js")(sequelize, Sequelize);
db.lineups = require("./lineup.js")(sequelize, Sequelize);
db.teams = require("./team.js")(sequelize, Sequelize);
db.gameStats = require("./gameStat.js")(sequelize, Sequelize);
db.dstGameStats = require("./dstGameStat.js")(sequelize, Sequelize);

module.exports = db;