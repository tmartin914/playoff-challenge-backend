const GameReader = require("../src/library/game-reader.js");
const gameData = require("../games/buffalo.json");

describe("Game Reader Tests", () => {
  test("JSON is in expected format & stats are properly calculated", () => {
    const gameReader = new GameReader(null);
    const gameStats = [];
    const dstGameStats = [];
    gameReader.updateGameStats(gameData, gameStats, dstGameStats);

    // Test Passing / Rushing (Home)
    joshAllen = gameStats.find(g => g.playerId == '3069db07-aa43-4503-ab11-2ae5c0002721');
    expect(joshAllen.passingYards).toBe(203);
    expect(joshAllen.passingTds).toBe(3);
    expect(joshAllen.rushingYards).toBe(74);
    expect(joshAllen.rushingTds).toBe(1);
    expect(joshAllen.totalPoints).toBe(33.52);

    // Test Rushing / Receiving (Away)
    georgePickens = gameStats.find(g => g.playerId == '018e8f25-54e5-44f1-967a-7ff237f1c52f');
    expect(georgePickens.receivingYards).toBe(50);
    expect(georgePickens.receivingTds).toBe(0);
    expect(georgePickens.rushingYards).toBe(15);
    expect(georgePickens.rushingTds).toBe(0);
    expect(georgePickens.fumblesLost).toBe(1);
    expect(georgePickens.totalPoints).toBe(7);

    // Test Kicking (Home)
    tylerBass = gameStats.find(g => g.playerId == 'bfccbff4-bc01-41ed-aa11-be976160504c');
    expect(tylerBass.fgs039).toBe(0);
    expect(tylerBass.fgs4049).toBe(1);
    expect(tylerBass.fgs50).toBe(0);
    expect(tylerBass.pats).toBe(4);
    expect(tylerBass.totalPoints).toBe(8);

    // Test DST (Away)
    bills = dstGameStats.find(g => g.playerId == '768c92aa-75ff-4a43-bcc0-f2798c2e1724');
    expect(bills.sacks).toBe(1);
    expect(bills.interceptions).toBe(1);
    expect(bills.fumblesRecovered).toBe(1);
    expect(bills.pointsAllowed).toBe(17);
    expect(bills.totalPoints).toBe(6);

    // Test Other Point Totals
    steelers = dstGameStats.find(g => g.playerId == 'cb2f9f1f-ac67-424e-9e72-1475cb0ed398');
    expect(steelers.totalPoints).toBe(3);

    patFreiermuth = gameStats.find(g => g.playerId == '04f0fefe-9d9d-44f5-94ea-6df2a42df3c6');
    expect(patFreiermuth.totalPoints).toBe(10.1);

    // TODO: write unit tests to test other misc things that did not happen in this game
  });
});