/**
 * Defines the Game Stats DB table
 */
module.exports = (sequelize, Sequelize) => {
  const GameStat = sequelize.define("gameStat", {
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
    passingYards: {
      type: Sequelize.INTEGER
    },
    passingTds: {
      type: Sequelize.INTEGER
    },
    interceptions: {
      type: Sequelize.INTEGER
    },
    rushingYards: {
      type: Sequelize.INTEGER
    },
    rushingTds: {
      type: Sequelize.INTEGER
    },
    receptions: {
      type: Sequelize.INTEGER
    },
    receivingYards: {
      type: Sequelize.INTEGER
    },
    receivingTds: {
      type: Sequelize.INTEGER
    },
    twoPointConversions: {
      type: Sequelize.INTEGER
    },
    fumblesLost: {
      type: Sequelize.INTEGER
    },
    miscTds: {
      type: Sequelize.INTEGER
    },
    fgs039: {
      type: Sequelize.INTEGER
    },
    fgs4049: {
      type: Sequelize.INTEGER
    },
    fgs50: {
      type: Sequelize.INTEGER
    },
    pats: {
      type: Sequelize.INTEGER
    }
  });

  return GameStat;
};