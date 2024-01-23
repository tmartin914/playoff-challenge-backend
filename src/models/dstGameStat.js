/**
 * Defines the DST Game Stats DB table
 */
module.exports = (sequelize, Sequelize) => {
  const DstGameStat = sequelize.define("dstGameStat", {
    playerId: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    week: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    totalPoints: {
      type: Sequelize.DOUBLE
    },
    statSummary: {
      type: Sequelize.STRING
    },
    sacks: {
      type: Sequelize.INTEGER
    },
    interceptions: {
      type: Sequelize.INTEGER
    },
    fumblesRecovered: {
      type: Sequelize.INTEGER
    },
    safeties: {
      type: Sequelize.INTEGER
    },
    blockedKicks: {
      type: Sequelize.INTEGER
    },
    tds: {
      type: Sequelize.INTEGER
    },
    pointsAllowed: {
      type: Sequelize.INTEGER
    }
  });

  return DstGameStat;
};