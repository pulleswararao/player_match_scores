const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "./cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Database error : ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchdbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//get players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

// get player id
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

//update player api

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateplayerQuery = `UPDATE player_details SET player_name = '${playerName}'
    WHERE player_id = ${playerId};`;
  await db.run(updateplayerQuery);
  response.send("Player Details Updated");
});

// get match details api
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const matchDetail = await db.get(getMatchQuery);
  response.send(convertMatchdbObjectToResponseObject(matchDetail));
});

// list of all matches of a player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchListQuery = `SELECT * FROM player_match_score NATURAL JOIN  match_details 
WHERE player_id = ${playerId};`;
  const matchList = await db.all(getMatchListQuery);
  response.send(
    matchList.map((eachMatch) =>
      convertMatchdbObjectToResponseObject(eachMatch)
    )
  );
});

// get players of a match
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersListQuery = `SELECT * FROM player_match_score  NATURAL JOIN player_details 
    WHERE match_id = ${matchId};`;
  const playerList = await db.all(getPlayersListQuery);
  response.send(
    playerList.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

// player scores api
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `SELECT player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes FROM player_match_score NATURAL JOIN player_details 
        WHERE player_id = ${playerId};`;
  const playerScore = await db.get(getPlayerScoreQuery);
  response.send(playerScore);
});

module.exports = app;
