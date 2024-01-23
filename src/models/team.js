/**
 * Defines the Team DB table
 */
module.exports = (sequelize, Sequelize) => {
  const Team = sequelize.define("team", {
    teamId: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    teamName: {
      type: Sequelize.STRING
    }
  });

  return Team;
};