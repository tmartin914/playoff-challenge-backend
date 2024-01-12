const db = require("../models");
const Player = db.players;
const Lineup = db.lineups;
const Op = db.Sequelize.Op;

const fs = require("fs-extra")
const path = require('path');
// TODO: make all of these kinds of things set by an env var
const playerDataJson = path.resolve('./backend/players.json'); //'./players.json');
const weekScheduleJson = path.resolve('./backend/weekSchedule.json'); //'./weekSchedule.json');

exports.findAll = (req, res) => {
  var currentDateTime = new Date();
  Player.findAll({ where: { available: true } })
    .then(data => {
      // lock players who's games already started
      data.forEach(player => {
        if (player.gameTime == null || player.gameTime >= currentDateTime) {
          player.dataValues.locked = false;
        } else {
          player.dataValues.locked = true;
        }
      });
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving tutorials."
      });
    });
};

const isPlayerInLineup = (playerId, lineup) => {
  playerIds = [lineup.qbId, lineup.rb1Id, lineup.rb2Id, lineup.wr1Id, lineup.wr2Id, lineup.teId, lineup.dstId, lineup.kId];
  return playerIds.includes(playerId);
}

exports.submitLineup = (req, res) => {
  const lineup = {
    teamId: req.body.teamId,
    teamName: "My Team",
    round: req.body.round,
    qbId: req.body.qb,
    rb1Id: req.body.rb1,
    rb2Id: req.body.rb2,
    wr1Id: req.body.wr1,
    wr2Id: req.body.wr2,
    teId: req.body.te,
    dstId: req.body.dst,
    kId: req.body.k
  }

  const currentDateTime = new Date();
  console.log(`Submit Lineup request for ${lineup.teamId} at ${currentDateTime}: ${lineup.qbId}, ${lineup.rb1Id}, ${lineup.rb2Id}, ${lineup.wr1Id}, ${lineup.wr2Id}, ${lineup.teId}, ${lineup.kId}, ${lineup.dstId}`);

  let existingLineup;
  Lineup.findOne({ where: {teamId: lineup.teamId, round: lineup.round}})
    .then(data => {
      if (data) {
        existingLineup = data;
      }

      // check that all players' games have not already started
      let isError = false;
      playerIds = [lineup.qbId, lineup.rb1Id, lineup.rb2Id, lineup.wr1Id, lineup.wr2Id, lineup.teId, lineup.dstId, lineup.kId];
      Player.findAll({ where: { id: { [Op.in]: playerIds }}})
        .then(players => {
          try {
            players.forEach(player => {
              if (player.gameTime != null && player.gameTime <= currentDateTime) {
                if (!existingLineup || !isPlayerInLineup(playerId, existinLineup)) { // if player is not in the existing lineup then throw an error
                  console.log(`Game for ${player.name} has already started`);
                  throw new Error(`Game for ${player.name} has already started`);
                }
              }
            });
          } catch (e) {
            isError = true;
            res.send({isSuccessful: false, message: e.message});
          }

          if (!isError) {
            Lineup.findOne({ where: {teamId: lineup.teamId, round: lineup.round}})
              .then(data => {
                if (data) {
                  data.update(lineup);
                  console.log('Lineup successfully updated');
                  res.send({isSuccessful: true, message: `Lineup successfully updated`});
                } else {
                  Lineup.create(lineup);
                  console.log('Lineup successfully created');
                  res.send({isSuccessful: true, message: `Lineup successfully created`});
                }
              })
              .catch(err => {
                console.log('Lineup failed' + err);
                res.send({isSuccessful: false, message: `Internal error, could not create lineup`});
                return;
              });
            }
        });
      //});
    });
}

exports.getLineup = (req, res) => {
  Lineup.findOne({ where: {teamId: req.params.teamId, round: req.params.round}})
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.send(null);
      }
    })
}

const applicablePositions = ['QB', 'RB', 'FB', 'WR', 'RWR', 'LWR', 'TE'];

exports.populateTable = async (req, res) => {
  console.log('populateTable');

  const weekScheduleData = await fs.readJson(weekScheduleJson);
  const teamGameTimes = {};

  // update the team game times dictionary
  weekScheduleData.week.games.forEach(game => {
    homeTeamAlias = game.home.alias;
    awayTeamAlias = game.away.alias;
    gameTime = game.scheduled;
    teamGameTimes[homeTeamAlias] = gameTime;
    teamGameTimes[awayTeamAlias] = gameTime;
  });

  const playerData = await fs.readJson(playerDataJson);
  const players = [];
  playerData.teams.forEach(team => {
    teamGameTime = teamGameTimes[team.alias];
    const tempPlayerArrays = team.offense.filter(p => applicablePositions.includes(p.position.name)).map(p => p.position.players);
    tempPlayerArrays.push(team.special_teams.find(p => p.position.name === 'K').position.players);
    tempPlayerArrays.forEach(playersArray => {
      playersArray.forEach(player => {
        players.push({ id: player.id, name: player.name, team: team.name, position: player.position, available: true, gameTime: teamGameTime });
      });
    });

    players.push({ id: team.id, name: team.name, team: team.name, position: 'DST', available: true, gameTime: teamGameTime })
  });

  Player.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Players were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all players."
      });
    });

  players.forEach(player => {
    createPlayer(player);
  });
};

createPlayer = (player) => {
  Player.create(player)
    .then(data => {
      //return true;
    })
    .catch(err => {
      console.log(err.message);
      // res.status(500).send({
      //   message:
      //     err.message || "Some error occurred while creating the Player"
      // });
      //return false;
    });
};
