const db = require("../models");
const Player = db.players;
const Lineup = db.lineups;
const Team = db.teams;
const GameStat = db.gameStats;
const DstGameStat = db.dstGameStats;
const Op = db.Sequelize.Op;

const GameReader = require("../library/game-reader.js");
const fs = require("fs-extra");
const path = require('path');
const { QueryTypes } = require('sequelize');

// TODO: make REST requests instead of reading from JSON files
const BASE_PATH = process.env.LOCAL_DEV ? './backend' : '.';
const playerDataPath = path.resolve(`${BASE_PATH}/players.json`);
const weekSchedulePath = path.resolve(`${BASE_PATH}/weekSchedule.json`);
const houstonGamePath = path.resolve(`${BASE_PATH}/games/houston.json`);

const APPLICABLE_POSITIONS = ['QB', 'RB', 'FB', 'WR', 'RWR', 'LWR', 'TE'];

exports.findAll = (req, res) => {
  var currentDateTime = new Date();
    Player.findAll({ where: { available: true } })
      .then(data => {
        // lock players who's games already started
        data.forEach(player => {
          if (player.gameTime == null || player.gameTime >= currentDateTime) {
            player.dataValues.locked = false;
          } else {
            //player.dataValues.locked = true;
            player.dataValues.locked = false; // TODO: revert
          }
        });
        res.send(data);
      })
      .catch(err => {
        res.status(500).send(err.message);
      });
};

/**
 * Returns whether the player Id is in the lineup
 * @param {*} playerId player Id
 * @param {*} lineup lineup
 * @returns flag indicating whether the player is in the lineup
 */
const isPlayerInLineup = (playerId, lineup) => {
  const playerIds = [lineup.qbId, lineup.rb1Id, lineup.rb2Id, lineup.wr1Id, lineup.wr2Id, lineup.teId, lineup.dstId, lineup.kId];
  return playerIds.includes(playerId);
}

/**
 * Submit Lineup
 */
exports.submitLineup = async (req, res) => {
  try {
    const team = await Team.findOne({ where: {teamId: req.body.teamId}, raw: true});
    if (!team) {
      throw Error('Invalid Team ID, could not create lineup');
    }

    const lineup = {
      teamId: req.body.teamId,
      teamName: team.teamName,
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
    const lockAllineups = new Date(2025, 0, 16, 1, 15, 0); // Add 5 hours
    //if (currentDateTime > lockAllineups) { // TODO: revert
    if (currentDateTime == lockAllineups) {
      console.log(`Lineups Locked. Lock Time: ${lockAllineups}. Current Time: ${currentDateTime}`);
      return res.status(500).send(`All lineups are locked for the week, could not create lineup`);
    }

    console.log(`Submit Lineup request for ${lineup.teamId} at ${currentDateTime}: ${lineup.qbId}, ${lineup.rb1Id}, ${lineup.rb2Id}, ${lineup.wr1Id}, ${lineup.wr2Id}, ${lineup.teId}, ${lineup.kId}, ${lineup.dstId}`);
    
    const existingLineup = await Lineup.findOne({ where: {teamId: lineup.teamId, round: lineup.round}});
    
    // check that all players' games have not already started
    const playerIds = [lineup.qbId, lineup.rb1Id, lineup.rb2Id, lineup.wr1Id, lineup.wr2Id, lineup.teId, lineup.dstId, lineup.kId];
    const players = await Player.findAll({ where: { id: { [Op.in]: playerIds }}});

    players?.forEach(player => {
      if (player.gameTime != null && player.gameTime <= currentDateTime) {
        if (!existingLineup || !isPlayerInLineup(player.id, existingLineup)) { // if player is not in the existing lineup then throw an error
          console.log(`Game for ${player.name} has already started`);
          //throw new Error(`Game for ${player.name} has already started`); // TODO: revert
        }
      }
    });

    let msg = '';
    if (existingLineup) {
      existingLineup.update(lineup);
      msg = 'Lineup successfully updated';
    } else {
      Lineup.create(lineup);
      msg = 'Lineup successfully created';
    }

    console.log(msg);
    return res.send({message: msg});
  } catch (err) {
    const msg = `Could not submit lineup. ${err.message}`;
    console.log(msg);
    res.status(500).send({message: msg});
  }
}

exports.getLineup = (req, res) => {
  Lineup.findOne({ where: {teamId: req.params.teamId, round: req.params.round}})
    .then(lineup => {
      if (lineup) {
        // TODO: turn into a lineup with scores
        // const playerIds = data.map(d => d.playerId);
        // GameStat.findAll({ where: { playerId: { [Op.in]: playerIds } } })
        //   .then(gameStats => {

        //   })
        res.send(lineup);
      } else {
        res.send(null);
      }
    })
}

/**
 * Gets the player if the player is locked
 * @param {*} playerId player Id
 * @param {*} players list of players
 * @param {*} round round
 * @param {*} isDst flag indicating whether the player is a DST
 * @returns player if the player is locked, otherwise undefined
 */
const getPlayerIfLocked = async (playerId, players, round, isDst = false) => {
  const currentDateTime = new Date();
  const player = players.find(p => p.id == playerId);
  // if (player.gameTime != null && player.gameTime <= currentDateTime) { // TODO: revert
  if (true) {
    if (isDst) {
      const gameStat = await DstGameStat.findOne({ where: { playerId: playerId, round: round }})
        .catch(err => { console.log(err); })

        player.totalPoints = gameStat.totalPoints;
    } else {
      try {
        const gameStat = await GameStat.findOne({ where: { playerId: playerId, round: round }})
        .catch(err => { console.log(err); })
        
        player.totalPoints = gameStat.totalPoints;
      } catch (err) {
        console.log(err);
      }
      
    }
    return player;
  } else {
    return undefined;
  }
}

/**
 * Get team given the team name
 * @param {*} req request
 * @param {*} res response
 */
exports.getTeam = async (req, res) => {
  const lineupToReturn = {};
  try {
    const round = req.params.round;
    const lineup = await Lineup.findOne({ where: {teamName: req.params.teamName, round: round}});
    const playerIds = [lineup.qbId, lineup.rb1Id, lineup.rb2Id, lineup.wr1Id, lineup.wr2Id, lineup.teId, lineup.dstId, lineup.kId];
    const players = await Player.findAll({ where: { id: { [Op.in]: playerIds }}, raw: true});
    
    lineupToReturn.qb = await getPlayerIfLocked(lineup.qbId, players, round);
    lineupToReturn.rb1 = await getPlayerIfLocked(lineup.rb1Id, players, round);
    lineupToReturn.rb2 = await getPlayerIfLocked(lineup.rb2Id, players, round);
    lineupToReturn.wr1 = await getPlayerIfLocked(lineup.wr1Id, players, round);
    lineupToReturn.wr2 = await getPlayerIfLocked(lineup.wr2Id, players, round);
    lineupToReturn.te = await getPlayerIfLocked(lineup.teId, players, round);
    lineupToReturn.k = await getPlayerIfLocked(lineup.kId, players, round);
    lineupToReturn.dst = await getPlayerIfLocked(lineup.dstId, players, round, true);
    res.send(lineupToReturn);
  } catch (err) {
    const msg = `Could not retrieve team. ${err.message}`;
    console.log(msg);
    res.status(500).send(msg);
  }
}

/**
 * Populate the game stats in the DB
 */
populateGameStats = async () => {
  const gameData = await fs.readJSON(houstonGamePath);
  const gameReader = new GameReader(GameStat, DstGameStat);
  gameReader.updateGameStats(gameData);
}



exports.populateDB = async (req, res) => {
  // Populate Week Schedule
  const weekScheduleData = await fs.readJson(weekSchedulePath);
  const teamGameTimes = {};

  // update the team game times dictionary
  weekScheduleData.week.games.forEach(game => {
    homeTeamAlias = game.home.alias;
    awayTeamAlias = game.away.alias;
    gameTime = game.scheduled;
    teamGameTimes[homeTeamAlias] = gameTime;
    teamGameTimes[awayTeamAlias] = gameTime;
  });

  // Populate Rosters
  const playerData = await fs.readJson(playerDataPath);
  const players = [];
  playerData.teams.forEach(team => {
    teamGameTime = teamGameTimes[team.alias];
    const tempPlayerArrays = team.offense.filter(p => APPLICABLE_POSITIONS.includes(p.position.name)).map(p => p.position.players);
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
      res.status(500).send(err.message);
    });

  round = 'Wildcard'
  players.forEach(player => {
    createPlayer(player, round);
  });

  // Populate Game Stats
  populateGameStats();
};

createPlayer = (player, round) => {
  Player.create(player)
    .then(data => {
    })
    .catch(err => {
      console.log(err.message);
    });

  gameStat = {
    playerId: player.Id,
    round: round,
    totalPoints: 0,
    statSummary: ''
  }

  GameStat.create(gameStat).catch(err => console.log(err.message));
};

exports.getStandings = async (req, res) => {
  const teams = await db.sequelize.query("SELECT teamName FROM `teams`", { type: QueryTypes.SELECT });
  res.send(teams);
}

/**
 * Create a Team
 */
exports.createTeam = async (req, res) => {
  Team.create({ teamId: req.params.teamId, teamName: req.params.teamName})
  .then(data => {
  })
  .catch(err => {
    console.log(err.message);
  });
  res.send();
}