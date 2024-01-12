module.exports = (sequelize, Sequelize) => {
  const Player = sequelize.define("player", {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING
    },
    team: {
      type: Sequelize.STRING
    },
    position: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    available: {
      type: Sequelize.BOOLEAN
    },
    gameTime: {
      type: Sequelize.DATE
    }
  });

  return Player;
};