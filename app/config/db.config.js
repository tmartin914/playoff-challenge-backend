module.exports = {
  // ABCD
  // HOST: "localhost",
  // USER: "root",
  // PASSWORD: "password",
  // DB: "playoff_challenge", // local
  HOST: "us-cluster-east-01.k8s.cleardb.net",
  USER: "bb30c340a1b0b3",
  PASSWORD: "c2fdfec8",
  DB: "heroku_f6a0378c464d1ae", // deploy
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};