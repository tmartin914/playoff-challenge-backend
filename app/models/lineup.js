module.exports = (sequelize, Sequelize) => {
  const Lineup = sequelize.define("lineup", {
    teamId: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    teamName: {
      type: Sequelize.STRING
    },
    week: {
      type: Sequelize.STRING
    },
    qbId: {
      type: Sequelize.STRING
    },
    rb1Id: {
      type: Sequelize.STRING
    },
    rb2Id: {
      type: Sequelize.STRING
    },
    wr1Id: {
      type: Sequelize.STRING
    },
    wr2Id: {
      type: Sequelize.STRING
    },
    teId: {
      type: Sequelize.STRING
    },
    kId: {
      type: Sequelize.STRING
    },
    dstId: {
      type: Sequelize.STRING
    },
  });

  return Lineup;
};