module.exports = app => {
  const players = require("../controllers/controller.js");

  var router = require("express").Router();

  router.get("/", players.findAll);
  router.get("/load", players.populateDB);
  router.get("/lineup/:teamId/:round", players.getLineup);
  router.post("/submitLineup", players.submitLineup);
  router.get("/getStandings", players.getStandings);
  router.get("/getTeam/:teamName", players.getTeam); // TODO: add round
  router.get("/createTeam/:teamId/:teamName", players.createTeam);

  app.use('/api/players', router);
};