const stadiumConfig = require("../systems/stadium");

let room;
let playerManager;

const GAME_TIME_LIMIT = 5 * 60; // 5 minutes in seconds
const SCORE_LIMIT = 5;
const MAX_PLAYERS_PER_TEAM = 6;

const balanceTeams = () => {
  const players = room.getPlayerList().filter((p) => {
    const playerObj = playerManager.getPlayer(p.name);
    return playerObj && playerObj.isLogged;
  });

  const teamSizes = [0, 0];
  const teamPlayers = [[], []];

  // Count current team sizes and organize players
  players.forEach((player) => {
    if (player.team === 1 || player.team === 2) {
      const teamIndex = player.team - 1;
      teamPlayers[teamIndex].push(player);
      teamSizes[teamIndex]++;
    }
  });

  // Function to get the team with fewer players
  const getSmallerTeam = () => (teamSizes[0] <= teamSizes[1] ? 1 : 2);

  // Handle players not in a team (spectators or new players)
  players.forEach((player) => {
    if (player.team === 0) {
      const smallerTeam = getSmallerTeam();
      if (teamSizes[smallerTeam - 1] < MAX_PLAYERS_PER_TEAM) {
        room.setPlayerTeam(player.id, smallerTeam);
        teamSizes[smallerTeam - 1]++;
      }
    }
  });

  // Balance teams if they are uneven
  const diff = Math.abs(teamSizes[0] - teamSizes[1]);
  if (diff > 1) {
    const largerTeam = teamSizes[0] > teamSizes[1] ? 1 : 2;
    const smallerTeam = 3 - largerTeam; // If largerTeam is 1, smallerTeam is 2, and vice versa
    const playersToMove = Math.floor(diff / 2);

    teamPlayers[largerTeam - 1].slice(-playersToMove).forEach((player) => {
      room.setPlayerTeam(player.id, smallerTeam);
      teamSizes[largerTeam - 1]--;
      teamSizes[smallerTeam - 1]++;
    });
  }

  // Ensure no team exceeds MAX_PLAYERS_PER_TEAM
  [1, 2].forEach((team) => {
    const teamIndex = team - 1;
    if (teamSizes[teamIndex] > MAX_PLAYERS_PER_TEAM) {
      const excessPlayers = teamSizes[teamIndex] - MAX_PLAYERS_PER_TEAM;
      teamPlayers[teamIndex].slice(-excessPlayers).forEach((player) => {
        room.setPlayerTeam(player.id, 0); // Move to spectators
        teamSizes[teamIndex]--;
      });
    }
  });
};

const resetGame = () => {
  room.stopGame();
  room.startGame();
  room.setTimeLimit(GAME_TIME_LIMIT);
  room.setScoreLimit(SCORE_LIMIT);
};

const initializeTriggerActions = (roomInstance, playerManagerInstance) => {
  room = roomInstance;
  playerManager = playerManagerInstance;

  room.onPlayerJoin = async (playerInfo) => {
    try {
      await playerManager.handlePlayerJoin(playerInfo);
      // Delay balancing to ensure player data is updated
      setTimeout(() => balanceTeams(), 1000);
    } catch (error) {
      console.error("Error in onPlayerJoin:", error);
    }
  };

  room.onPlayerLeave = async (player) => {
    try {
      await playerManager.handlePlayerLeave(player);
      // Balance teams after a player leaves
      setTimeout(() => balanceTeams(), 1000);
    } catch (error) {
      console.error("Error in onPlayerLeave:", error);
    }
  };

  room.onTeamVictory = async (scores) => {
    console.log("Team victory", scores);
    await playerManager.handleTeamVictory(scores);
    // Reset the game after a short delay
    setTimeout(() => {
      balanceTeams();
      resetGame();
    }, 15000); // 15 seconds delay
  };

  room.onGameTick = () => {
    // Check if the time limit has been reached
    const scores = room.getScores();
    if (scores && scores.time >= GAME_TIME_LIMIT) {
      room.sendAnnouncement("Time limit reached. Resetting the game.");
      balanceTeams();
      resetGame();
    }
  };

  room.onPlayerChat = (player, message) => {
    playerManager.handleChat(player, message);
    return false;
  };

  room.setCustomStadium(JSON.stringify(stadiumConfig));

  // Ensure the game is running and teams are balanced initially
  balanceTeams();
  resetGame();
};

module.exports = {
  initializeTriggerActions,
  balanceTeams,
};
