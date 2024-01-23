/**
 * Class for reading game data and updating the DB
 */
class GameReader {
  /**
   * Constructor
   * @param {*} GameStat - game stats sequelize model
   * @param {*} DstGameStat - DST game stats sequelize model
   */
  constructor(GameStat, DstGameStat) {
    this.GameStat = GameStat;
    this.DstGameStat = DstGameStat;
  }

  saveGameStats(gameStats, dstGameStats) {
    this.GameStat.bulkCreate(gameStats, { updateOnDuplicate: ["playerId", "week"] })
      .then(resp => {
        
      })
      .catch(err => {
        console.log(err);
      });

    this.DstGameStat.bulkCreate(dstGameStats, { updateOnDuplicate: ["playerId", "week"] })
      .then(resp => {
        
      })
      .catch(err => {
        console.log(err);
      });
  }

  async updateGameStats(gameData) {
    this.GameStat.findAll()
      .then(gameStats => {
        this.DstGameStat.findAll()
          .then(dstGameStats => {
            this.parseGameStats(gameData, gameStats, dstGameStats);
            this.saveGameStats(gameStats, dstGameStats);
          })
          .catch(err => {
            console.log(err);
          })
      })
      .catch(err => {
        console.log(err);
      })
  }

  findOrCreateGameStat(playerId, week, gameStats) {
    let gameStat = gameStats.find(g => g.playerId === playerId);
    if (!gameStat) {
      gameStat = { playerId: playerId, week: week }
      gameStats.push(gameStat);
    }

    return gameStat;
  }

  replaceUndefinedWithZero(number) {
    return number ?? 0
  }

  /**
   * Calculates the total points for the game stat
   * @param {*} gameStat game stat
   */
  calculatePoints(gameStat) {
    let totalPoints = 0.0;
    
    // Passing
    totalPoints += 0.04 * (gameStat.passingYards ?? 0);
    totalPoints += 4 * (gameStat.passingTds ?? 0);
    totalPoints -= (gameStat.interceptions ?? 0);

    // Rushing
    totalPoints += 0.1 * (gameStat.rushingYards ?? 0);
    totalPoints += 6 * (gameStat.rushingTds ?? 0);

    // Receiving
    totalPoints += 0.1 * (gameStat.receivingYards ?? 0);
    totalPoints += 6 * (gameStat.receivingTds ?? 0);
    totalPoints += 0.5 * (gameStat.receptions ?? 0);

    // Kicking
    totalPoints += 3 * (gameStat.fgs039 ?? 0);
    totalPoints += 4 * (gameStat.fgs4049 ?? 0);
    totalPoints += 5 * (gameStat.fgs50 ?? 0);
    totalPoints += (gameStat.pats ?? 0);

    // Misc
    totalPoints -= 2 * (gameStat.fumblesLost ?? 0);
    totalPoints += 6 * (gameStat.miscTds ?? 0);

    return parseFloat(totalPoints.toFixed(2));
  }

  /**
   * Calculates the total points for the DST game stat
   * @param {*} gameStat dst game stat
   */
  calculateDstPoints(gameStat) {
    let totalPoints = 0.0;
    
    totalPoints += (gameStat.sacks ?? 0);
    totalPoints += 2 * (gameStat.interceptions ?? 0);
    totalPoints += 2 * (gameStat.fumblesRecovered ?? 0);
    totalPoints += 2 * (gameStat.blockedKicks ?? 0);
    totalPoints += 2 * (gameStat.safeties ?? 0);
    totalPoints += 6 * (gameStat.tds ?? 0);

    if (gameStat.pointsAllowed >= 35) {
      totalPoints -= 4;
    } else if (gameStat.pointsAllowed >= 28) {
      totalPoints -= 1;
    } else if (gameStat.pointsAllowed >= 21) {
      // No change
    } else if (gameStat.pointsAllowed >= 14) {
      totalPoints += 1;
    } else if (gameStat.pointsAllowed >= 7) {
      totalPoints += 4;
    } else if (gameStat.pointsAllowed >= 1) {
      totalPoints += 7;
    } else {
      totalPoints += 10;
    }

    return totalPoints;
  }

  /**
   * Reset Incremental Game Stats to 0 so they don't keep incrementing oon every update
   * @param {*} gameStats game stats 
   */
  clearIncrementalGameStats(gameStats) {
    gameStats.forEach(gameStat => {
      gameStat.twoPointConversions = 0;
      gameStat.miscTds = 0;
    });
  }

  /**
   * Parses JSON into game stats
   * @param {*} gameData - game data as JSON
   * @param {*} gameStats - game stats
   * @param {*} dstGameStats - DST game stats  
   */
  parseGameStats(gameData, gameStats, dstGameStats) {
    this.clearIncrementalGameStats(gameStats);
    const home = gameData.statistics.home;
    const away = gameData.statistics.away;

    // Update Passing Stats
    const passing = home.passing.players.concat(away.passing.players);
    passing.forEach(player => {
      let gameStat = this.findOrCreateGameStat(player.id, 'Divisional', gameStats);
      gameStat.passingYards = player.yards;
      gameStat.passingTds = player.touchdowns;
      gameStat.interceptions = player.interceptions;
    });
      
    // Update Rushing Stats
    const rushing = home.rushing.players.concat(away.rushing.players);
    rushing.forEach(player => {
      let gameStat = this.findOrCreateGameStat(player.id, 'Divisional', gameStats);
      gameStat.rushingYards = player.yards;
      gameStat.rushingTds = player.touchdowns;
    });

    // Update Receiving Stats
    const receiving = home.receiving.players.concat(away.receiving.players);
    receiving.forEach(player => {
      let gameStat = this.findOrCreateGameStat(player.id, 'Divisional', gameStats);
      gameStat.receivingYards = player.yards;
      gameStat.receivingTds = player.touchdowns;
      gameStat.receptions = player.receptions;
    });

    // Update Fumble Stats
    const fumbles = home.fumbles.players.concat(away.fumbles.players);
    fumbles.forEach(player => {
      let gameStat = this.findOrCreateGameStat(player.id, 'Divisional', gameStats);
      gameStat.fumblesLost = player.lost_fumbles;
    });

    // Update 2 Point Conversion Stats
    const twoPts = home.extra_points.conversions.players.concat(away.extra_points.conversions.players);
    twoPts.forEach(player => {
      let gameStat = this.findOrCreateGameStat(player.id, 'Divisional', gameStats);
      gameStat.twoPointConversions += player.successes;
    });

    // Update Misc TD Stats
    const kickReturns = home.kick_returns.players.concat(away.kick_returns.players);
    kickReturns.forEach(player => {
      if (player.touchdowns) {
        let gameStat = this.findOrCreateGameStat(player.id, 'Divisional', gameStats);
        gameStat.miscTds += player.touchdowns;
      }
    });

    const puntReturns = home.punt_returns.players.concat(away.punt_returns.players);
    puntReturns.forEach(player => {
      if (player.touchdowns) {
        let gameStat = this.findOrCreateGameStat(player.id, 'Divisional', gameStats);
        gameStat.miscTds += player.touchdowns;
      }
    });

    const miscReturns = home.misc_returns.players.concat(away.misc_returns.players);
    miscReturns.forEach(player => {
      if (player.touchdowns) {
        let gameStat = this.findOrCreateGameStat(player.id, 'Divisional', gameStats);
        gameStat.miscTds += player.touchdowns;
      }
    });

    // Update Kicking Stats
    const fieldGoals = home.field_goals.players.concat(away.field_goals.players);
    fieldGoals.forEach(player => {
      let gameStat = this.findOrCreateGameStat(player.id, 'Divisional', gameStats);
      gameStat.fgs039 = player.made_19 + player.made_29 + player.made_39;
      gameStat.fgs4049 = player.made_49;
      gameStat.fgs50 = player.made_50;
    });

    const pats = home.extra_points.kicks.players.concat(away.extra_points.kicks.players);
    pats.forEach(player => {
      let gameStat = this.findOrCreateGameStat(player.id, 'Divisional', gameStats);
      gameStat.pats = player.made;
    });

    // Update DST Stats
    home.defense.totals.id = home.id;
    away.defense.totals.id = away.id;
    const defense = [home.defense.totals, away.defense.totals];
    defense.forEach(team => {
      let gameStat = this.findOrCreateGameStat(team.id, 'Divisional', dstGameStats);
      gameStat.sacks = team.sacks;
      gameStat.interceptions = team.interceptions;
      gameStat.fumblesRecovered = team.fumble_recoveries + team.sp_fumble_recoveries;
      gameStat.safeties = team.safeties;
      gameStat.blockedKicks = team.sp_blocks;
    });

    home.touchdowns.id = home.id;
    away.touchdowns.id = away.id
    const touchdowns = [home.touchdowns, away.touchdowns];
    touchdowns.forEach(team => {
      let gameStat = this.findOrCreateGameStat(team.id, 'Divisional', dstGameStats);
      gameStat.tds = team.total_return;
      gameStat.pointsAllowed = (gameStat.playerId == home.id) ? gameData.summary.away.points : gameData.summary.home.points;
    });

    // TODO: might be missing kick return fumbles lost

    // calc total points
    gameStats.forEach(gameStat => {
      gameStat.totalPoints = this.calculatePoints(gameStat);
      // TODO: set statSummary
    });

    // calc dst total points
    dstGameStats.forEach(gameStat => {
      gameStat.totalPoints = this.calculateDstPoints(gameStat);
    });
  }
}

module.exports = GameReader;