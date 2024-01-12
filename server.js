const express = require("express");
const cors= require("cors");

const app = express();

var corsOptions = {
    origin: ["http://localhost:3000", "http://localhost:3001", "https://playoff-challenge-frontend-7b0dc86b07c6.herokuapp.com"]
};

app.use(cors(corsOptions));

app.use(express.json());

const db = require("./app/models");
//db.sequelize.sync();
// TODO: used for dev only
db.sequelize.sync({ force: true }).then(() => {
  console.log("Drop and re-sync db.");
});

require("./app/routes/routes.js")(app);

// ABCD
const PORT = process.env.PORT || 3000; // deploy
//const PORT = process.env.PORT || 8080; // local
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}"`);
});