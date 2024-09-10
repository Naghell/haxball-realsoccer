const { Game, pointDistance } = require("../game/game");
const { OperationType, Utils } = require("node-haxball")();

let room;
let playerManager;
let game;

const lastActionExecution = {};
const kickTimers = {};
const MAX_PLAYERS_PER_TEAM = 6;
const GAME_TIME = 5;
const GAME_TIME_LIMIT = 5 * 60;
const SCORE_LIMIT = 5;
const GK_TIMEOUT = 600;
const CK_TIMEOUT = 600;
const THROW_TIMEOUT = 420;
const THROW_IN_DISTANCE = 270;
const COOLDOWN_TIME = 20000;
const HOLD_DURATION = 800;
const SLIDE_SPEED_MULTIPLIER = 3; //Slide power
const SLOW_SPEED = 0.2; //Slow speed from slide

const COLLISION_THRESHOLD = 5; // Minimum speed for a foul
const SEVERE_FOUL_THRESHOLD = 15; // Speed threshold for a red card
const BALL_TOUCH_WINDOW = 500; // 0.5 seconds in milliseconds
const YELLOW_CARD_LIMIT = 2; // Number of yellow cards before a red card

const playerCards = {};

const balanceTeams = () => {
  const players = room.players?.filter((p) => {
    const playerObj = playerManager.getPlayer(p.id);
    return playerObj && playerObj.isLogged;
  });

  const teamSizes = [0, 0];
  const teamPlayers = [[], []];

  // Count current team sizes and organize players
  players?.forEach((player) => {
    if (player.team.id === 1 || player.team.id === 2) {
      const teamIndex = player.team.id - 1;
      teamPlayers[teamIndex].push(player);
      teamSizes[teamIndex]++;
    }
  });

  // Function to get the team with fewer players
  const getSmallerTeam = () => (teamSizes[0] <= teamSizes[1] ? 1 : 2);

  // Handle players not in a team (spectators or new players)
  players?.forEach((player) => {
    if (player.team.id === 0) {
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
    const teamIndex = team.id - 1;
    if (teamSizes[teamIndex] > MAX_PLAYERS_PER_TEAM) {
      const excessPlayers = teamSizes[teamIndex] - MAX_PLAYERS_PER_TEAM;
      teamPlayers[teamIndex].slice(-excessPlayers).forEach((player) => {
        room.setPlayerTeam(player.id, 0); // Move to spectators
        teamSizes[teamIndex]--;
      });
    }
  });
};

const avatarCelebration = (playerId, avatar, playerAvatar) => {
  room.setPlayerAvatar(playerId, avatar);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, playerAvatar);
  }, 250);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 500);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, playerAvatar);
  }, 750);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 1000);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, playerAvatar);
  }, 1250);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 1500);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, playerAvatar);
  }, 1750);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 2000);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, playerAvatar);
  }, 2250);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 2500);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, playerAvatar);
  }, 2750);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 3000);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, playerAvatar);
  }, 3250);
};

const ballWarning = (origColour, warningCount) => {
  setTimeout(() => {
    if (game.warningCount == warningCount) {
      room.setDiscProperties(0, { color: "0xffffff" });
    }
  }, 200);
  setTimeout(() => {
    if (game.warningCount == warningCount) {
      room.setDiscProperties(0, { color: origColour });
    }
  }, 400);
  setTimeout(() => {
    if (game.warningCount == warningCount) {
      room.setDiscProperties(0, { color: "0xffffff" });
    }
  }, 600);
  setTimeout(() => {
    if (game.warningCount == warningCount) {
      room.setDiscProperties(0, { color: origColour });
    }
  }, 800);
  setTimeout(() => {
    if (game.warningCount == warningCount) {
      room.setDiscProperties(0, { color: "0xffffff" });
    }
  }, 1000);
  setTimeout(() => {
    if (game.warningCount == warningCount) {
      room.setDiscProperties(0, { color: origColour });
    }
  }, 1200);
  setTimeout(() => {
    if (game.warningCount == warningCount) {
      room.setDiscProperties(0, { color: "0xffffff" });
    }
  }, 1400);
  setTimeout(() => {
    if (game.warningCount == warningCount) {
      room.setDiscProperties(0, { color: origColour });
    }
  }, 1600);
  setTimeout(() => {
    if (game.warningCount == warningCount) {
      room.setDiscProperties(0, { color: "0xffffff" });
    }
  }, 1675);
  setTimeout(() => {
    if (game.warningCount == warningCount) {
      room.setDiscProperties(0, { color: origColour });
    }
  }, 1750);
};

const realSoccerRef = () => {
  if (game.rsActive == false && game.rsReady == true) {
    if (game.outStatus == "redThrow") {
      if (game.rsTimer == THROW_TIMEOUT - 120) {
        ballWarning("0xff3f34", ++game.warningCount);
      }
      if (game.rsTimer == THROW_TIMEOUT && game.bringThrowBack == false) {
        game.outStatus = "blueThrow";
        game.rsTimer = 0;
        room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        setTimeout(() => {
          room.setDiscProperties(0, {
            color: "0x0fbcf9",
            xspeed: 0,
            yspeed: 0,
            x: game.ballOutPositionX,
            y: game.throwInPosY,
          });
        }, 100);
      }
    } else if (game.outStatus == "blueThrow") {
      if (game.rsTimer == THROW_TIMEOUT - 120) {
        ballWarning("0x0fbcf9", ++game.warningCount);
      }
      if (game.rsTimer == THROW_TIMEOUT && game.bringThrowBack == false) {
        game.outStatus = "redThrow";
        game.rsTimer = 0;
        room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        setTimeout(() => {
          room.setDiscProperties(0, {
            color: "0xff3f34",
            xspeed: 0,
            yspeed: 0,
            x: game.ballOutPositionX,
            y: game.throwInPosY,
          });
        }, 100);
      }
    } else if (game.outStatus == "blueGK" || game.outStatus == "redGK") {
      if (game.rsTimer == GK_TIMEOUT - 120) {
        if (game.outStatus == "blueGK") {
          ballWarning("0x0fbcf9", ++game.warningCount);
        }
        if (game.outStatus == "redGK") {
          ballWarning("0xff3f34", ++game.warningCount);
        }
      }
      if (game.rsTimer == GK_TIMEOUT) {
        game.outStatus = "";
        room.setDiscProperties(0, { color: "0xffffff" });
        game.rsTimer = 1000000;
      }
    } else if (game.outStatus == "blueCK" || game.outStatus == "redCK") {
      if (game.rsTimer == CK_TIMEOUT - 120) {
        if (game.outStatus == "blueCK") {
          ballWarning("0x0fbcf9", ++game.warningCount);
        }
        if (game.outStatus == "redCK") {
          ballWarning("0xff3f34", ++game.warningCount);
        }
      }
      if (game.rsTimer == CK_TIMEOUT) {
        game.outStatus = "";
        room.setDiscProperties(1, { x: 0, y: 2000, radius: 0 });
        room.setDiscProperties(2, { x: 0, y: 2000, radius: 0 });
        room.setDiscProperties(0, { color: "0xffffff" });
        game.rsTimer = 1000000;
      }
    }
  }

  if (game.rsActive == true) {
    if (
      room.gameState.physicsState.discs[0]?.pos.y > 612 ||
      room.gameState.physicsState.discs[0]?.pos.y < -612
    ) {
      game.rsActive = false;
      if (game.lastPlayAnnounced == true) {
        room.pauseGame(true);
        game.lastPlayAnnounced = false;
        room.sendAnnouncement("📢 FIN DEL PARTIDO.");
        room.sendAnnouncement("🎥 La partida ha sido enviada al discord.");
      }

      room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });

      game.ballOutPositionX =
        Math.round(room.gameState.physicsState.discs[0]?.pos.x * 10) / 10;
      if (room.gameState.physicsState.discs[0]?.pos.y > 612) {
        game.ballOutPositionY = 400485;
        game.throwInPosY = 618;
      }
      if (room.gameState.physicsState.discs[0]?.pos.y < -612) {
        game.ballOutPositionY = -400485;
        game.throwInPosY = -618;
      }
      if (room.gameState.physicsState.discs[0]?.pos.x > 1130) {
        game.ballOutPositionX = 1130;
      }
      if (room.gameState.physicsState.discs[0]?.pos.x < -1130) {
        game.ballOutPositionX = -1130;
      }

      if (game.rsTouchTeam == 1) {
        room.setDiscProperties(3, {
          x: game.ballOutPositionX,
          y: game.throwInPosY,
          radius: 18,
        });
        setTimeout(() => {
          game.outStatus = "blueThrow";
          game.throwinKicked = false;
          game.rsTimer = 0;
          game.rsReady = true;
          room.setDiscProperties(0, {
            xspeed: 0,
            yspeed: 0,
            x: game.ballOutPositionX,
            y: game.throwInPosY,
            xgravity: 0,
            ygravity: 0,
          });
          room.setDiscProperties(0, { color: "0x0fbcf9" });
        }, 100);
        setTimeout(() => {
          room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        }, 100);
      } else {
        room.setDiscProperties(3, {
          x: game.ballOutPositionX,
          y: game.throwInPosY,
          radius: 18,
        });
        setTimeout(() => {
          game.outStatus = "redThrow";
          game.throwinKicked = false;
          game.rsTimer = 0;
          game.rsReady = true;
          room.setDiscProperties(0, {
            xspeed: 0,
            yspeed: 0,
            x: game.ballOutPositionX,
            y: game.throwInPosY,
            xgravity: 0,
            ygravity: 0,
          });
          room.setDiscProperties(0, { color: "0xff3f34" });
        }, 100);
        setTimeout(() => {
          room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        }, 100);
      }
    }
  }
  if (game.rsCorner == true || game.rsGoalKick == true) {
    game.extraTimeCount++;
  }

  if (
    game.rsTimer < 99999 &&
    game.paused == false &&
    game.rsActive == false &&
    game.rsReady == true
  ) {
    game.rsTimer++;
  }

  if (
    game.rsSwingTimer < 150 &&
    game.rsCorner == false &&
    game.rsGoalKick == false
  ) {
    game.rsSwingTimer++;
    if (game.rsSwingTimer > 5) {
      room.setDiscProperties(0, {
        xgravity: room.gameState.physicsState.discs[0]?.gravity.x * 0.97,
        ygravity: room.gameState.physicsState.discs[0]?.gravity.y * 0.97,
      });
    }
    if (game.rsSwingTimer == 150) {
      room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });
    }
  }

  if (game.boosterState == true) {
    game.boosterCount++;
  }

  if (game.boosterCount > 30) {
    game.boosterState = false;
    game.boosterCount = 0;
    room.setDiscProperties(0, { cMask: 63 });
  }

  if (
    room.gameState.physicsState.discs[0]?.pos.x == 0 &&
    room.gameState.physicsState.discs[0]?.pos.y == 0
  ) {
    game.rsActive = true;
    game.outStatus = "";
  }

  if (game.rsActive == false && game.rsReady == true) {
    if (game.outStatus == "redThrow") {
      console.log("red throw");
      if (game.rsTimer == THROW_TIMEOUT - 120) {
        ballWarning("0xff3f34", ++game.warningCount);
      }
      if (game.rsTimer == THROW_TIMEOUT && game.bringThrowBack == false) {
        game.outStatus = "blueThrow";
        game.rsTimer = 0;
        room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        setTimeout(() => {
          room.setDiscProperties(0, {
            color: "0x0fbcf9",
            xspeed: 0,
            yspeed: 0,
            x: game.ballOutPositionX,
            y: game.throwInPosY,
          });
        }, 100);
      }
    } else if (game.outStatus == "blueThrow") {
      if (game.rsTimer == THROW_TIMEOUT - 120) {
        ballWarning("0x0fbcf9", ++game.warningCount);
      }
      if (game.rsTimer == THROW_TIMEOUT && game.bringThrowBack == false) {
        game.outStatus = "redThrow";
        game.rsTimer = 0;
        room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        setTimeout(() => {
          room.setDiscProperties(0, {
            color: "0xff3f34",
            xspeed: 0,
            yspeed: 0,
            x: game.ballOutPositionX,
            y: game.throwInPosY,
          });
        }, 100);
      }
    } else if (game.outStatus == "blueGK" || game.outStatus == "redGK") {
      if (game.rsTimer == GK_TIMEOUT - 120) {
        if (game.outStatus == "blueGK") {
          ballWarning("0x0fbcf9", ++game.warningCount);
        }
        if (game.outStatus == "redGK") {
          ballWarning("0xff3f34", ++game.warningCount);
        }
      }
      if (game.rsTimer == GK_TIMEOUT) {
        game.outStatus = "";
        room.setDiscProperties(0, { color: "0xffffff" });
        game.rsTimer = 1000000;
      }
    } else if (game.outStatus == "blueCK" || game.outStatus == "redCK") {
      if (game.rsTimer == CK_TIMEOUT - 120) {
        if (game.outStatus == "blueCK") {
          ballWarning("0x0fbcf9", ++game.warningCount);
        }
        if (game.outStatus == "redCK") {
          ballWarning("0xff3f34", ++game.warningCount);
        }
      }
      if (game.rsTimer == CK_TIMEOUT) {
        game.outStatus = "";
        room.setDiscProperties(1, { x: 0, y: 2000, radius: 0 });
        room.setDiscProperties(2, { x: 0, y: 2000, radius: 0 });
        room.setDiscProperties(0, { color: "0xffffff" });
        game.rsTimer = 1000000;
      }
    }
  }

  if (game.rsActive == true) {
    if (
      room.gameState.physicsState.discs[0]?.pos.y > 612 ||
      room.gameState.physicsState.discs[0]?.pos.y < -612
    ) {
      game.rsActive = false;
      if (game.lastPlayAnnounced == true) {
        room.pauseGame(true);
        game.lastPlayAnnounced = false;
        room.sendAnnouncement("📢 FIN DEL PARTIDO.");
        room.sendAnnouncement("🎥 La partida ha sido enviada al discord.");
      }

      room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });

      game.ballOutPositionX =
        Math.round(room.gameState.physicsState.discs[0]?.pos.x * 10) / 10;
      if (room.gameState.physicsState.discs[0]?.pos.y > 612) {
        game.ballOutPositionY = 400485;
        game.throwInPosY = 618;
      }
      if (room.gameState.physicsState.discs[0]?.pos.y < -612) {
        game.ballOutPositionY = -400485;
        game.throwInPosY = -618;
      }
      if (room.gameState.physicsState.discs[0]?.pos.x > 1130) {
        game.ballOutPositionX = 1130;
      }
      if (room.gameState.physicsState.discs[0]?.pos.x < -1130) {
        game.ballOutPositionX = -1130;
      }

      if (game.rsTouchTeam == 1) {
        room.setDiscProperties(3, {
          x: game.ballOutPositionX,
          y: game.throwInPosY,
          radius: 18,
        });
        setTimeout(() => {
          game.outStatus = "blueThrow";
          game.throwinKicked = false;
          game.rsTimer = 0;
          game.rsReady = true;
          room.setDiscProperties(0, {
            xspeed: 0,
            yspeed: 0,
            x: game.ballOutPositionX,
            y: game.throwInPosY,
            xgravity: 0,
            ygravity: 0,
          });
          room.setDiscProperties(0, { color: "0x0fbcf9" });
        }, 100);
        setTimeout(() => {
          room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        }, 100);
      } else {
        room.setDiscProperties(3, {
          x: game.ballOutPositionX,
          y: game.throwInPosY,
          radius: 18,
        });
        setTimeout(() => {
          game.outStatus = "redThrow";
          game.throwinKicked = false;
          game.rsTimer = 0;
          game.rsReady = true;
          room.setDiscProperties(0, {
            xspeed: 0,
            yspeed: 0,
            x: game.ballOutPositionX,
            y: game.throwInPosY,
            xgravity: 0,
            ygravity: 0,
          });
          room.setDiscProperties(0, { color: "0xff3f34" });
        }, 100);
        setTimeout(() => {
          room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        }, 100);
      }
    }

    if (
      room.gameState.physicsState.discs[0]?.pos.x > 1162 &&
      (room.gameState.physicsState.discs[0]?.pos.y > 124 ||
        room.gameState.physicsState.discs[0]?.pos.y < -124)
    ) {
      game.rsActive = false;
      if (game.lastPlayAnnounced == true) {
        room.pauseGame(true);
        game.lastPlayAnnounced = false;
        room.sendAnnouncement("📢 FIN DEL PARTIDO.");
        room.sendAnnouncement("🎥 La partida ha sido enviada al discord.");
      }
      room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });
      room.players?.forEach(function (player) {
        room.setPlayerDiscProperties(player.id, { invMass: 100000 });
      });

      if (game.rsTouchTeam == 1) {
        room.setDiscProperties(3, { x: 1060, y: 0, radius: 18 });
        console.log("bluegk");
        setTimeout(() => {
          game.outStatus = "blueGK";
          game.rsTimer = 0;
          game.rsReady = true;
          game.rsGoalKick = true;
          game.rsSwingTimer = 0;
          game.boosterCount = 0;
          game.boosterState = false;
          room.setDiscProperties(0, {
            xspeed: 0,
            yspeed: 0,
            x: 1060,
            y: 0,
            color: "0x0fbcf9",
            cMask: 268435519,
            xgravity: 0,
            ygravity: 0,
          });
        }, 100);
        setTimeout(() => {
          room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        }, 3000);
      } else {
        game.rsSwingTimer = 0;
        if (room.gameState.physicsState.discs[0]?.pos.y < -124) {
          room.setDiscProperties(3, { x: 1140, y: -590, radius: 18 });
          setTimeout(() => {
            game.rsCorner = true;
            game.outStatus = "redCK";
            game.rsTimer = 0;
            game.rsReady = true;
            game.boosterCount = 0;
            game.boosterState = false;
            room.setDiscProperties(0, {
              x: 1140,
              y: -590,
              xspeed: 0,
              yspeed: 0,
              color: "0xff3f34",
              cMask: 268435519,
              xgravity: 0,
              ygravity: 0,
            });
            room.setDiscProperties(2, { x: 1150, y: -670, radius: 420 });
            room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
          }, 100);
        }
        if (room.gameState.physicsState.discs[0]?.pos.y > 124) {
          room.setDiscProperties(3, { x: 1140, y: 590, radius: 18 });
          setTimeout(() => {
            game.rsCorner = true;
            game.outStatus = "redCK";
            game.rsTimer = 0;
            game.rsReady = true;
            game.boosterCount = 0;
            game.boosterState = false;
            room.setDiscProperties(0, {
              x: 1140,
              y: 590,
              xspeed: 0,
              yspeed: 0,
              color: "0xff3f34",
              cMask: 268435519,
              xgravity: 0,
              ygravity: 0,
            });
            room.setDiscProperties(2, { x: 1150, y: 670, radius: 420 });
            room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
          }, 100);
        }
      }
    }
    if (
      room.gameState.physicsState.discs[0]?.pos.x < -1162 &&
      (room.gameState.physicsState.discs[0]?.pos.y > 124 ||
        room.gameState.physicsState.discs[0]?.pos.y < -124)
    ) {
      game.rsActive = false;
      if (game.lastPlayAnnounced == true) {
        room.pauseGame(true);
        game.lastPlayAnnounced = false;
        room.sendAnnouncement("📢 FIN DEL PARTIDO.");
        room.sendAnnouncement("🎥 La partida ha sido enviada al discord.");
      }
      room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });
      room.players?.forEach(function (player) {
        room.setPlayerDiscProperties(player.id, { invMass: 100000 });
      });

      if (game.rsTouchTeam == 1) {
        game.rsSwingTimer = 0;
        if (room.gameState.physicsState.discs[0]?.pos.y < -124) {
          room.setDiscProperties(3, { x: -1140, y: -590, radius: 18 });
          setTimeout(() => {
            game.rsCorner = true;
            game.outStatus = "blueCK";
            game.rsTimer = 0;
            game.rsReady = true;
            game.boosterCount = 0;
            game.boosterState = false;
            room.setDiscProperties(0, {
              x: -1140,
              y: -590,
              xspeed: 0,
              yspeed: 0,
              color: "0x0fbcf9",
              cMask: 268435519,
              xgravity: 0,
              ygravity: 0,
            });
            room.setDiscProperties(1, { x: -1150, y: -670, radius: 420 });
            room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
          }, 100);
        }
        if (room.gameState.physicsState.discs[0]?.pos.y > 124) {
          room.setDiscProperties(3, { x: -1140, y: 590, radius: 18 });
          setTimeout(() => {
            game.rsCorner = true;
            game.outStatus = "blueCK";
            game.rsTimer = 0;
            game.rsReady = true;
            game.boosterCount = 0;
            game.boosterState = false;
            room.setDiscProperties(0, {
              x: -1140,
              y: 590,
              xspeed: 0,
              yspeed: 0,
              color: "0x0fbcf9",
              cMask: 268435519,
              xgravity: 0,
              ygravity: 0,
            });
            room.setDiscProperties(1, { x: -1150, y: 670, radius: 420 });
            room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
          }, 100);
        }
      } else {
        room.setDiscProperties(3, { x: -1060, y: 0, radius: 18 });
        setTimeout(() => {
          game.outStatus = "redGK";
          game.rsTimer = 0;
          game.rsReady = true;
          game.rsGoalKick = true;
          game.rsSwingTimer = 0;
          game.boosterCount = 0;
          game.boosterState = false;
          room.setDiscProperties(0, {
            xspeed: 0,
            yspeed: 0,
            x: -1060,
            y: 0,
            color: "0xff3f34",
            cMask: 268435519,
            xgravity: 0,
            ygravity: 0,
          });
        }, 100);
        setTimeout(() => {
          room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        }, 3000);
      }
    }
  }

  if (
    game.rsActive == false &&
    (game.outStatus == "redThrow" || game.outStatus == "blueThrow")
  ) {
    if (
      (room.gameState.physicsState.discs[0]?.pos.y > 612 ||
        room.gameState.physicsState.discs[0]?.pos.y < -612) &&
      (room.gameState.physicsState.discs[0]?.pos.x <
        game.ballOutPositionX - THROW_IN_DISTANCE ||
        room.gameState.physicsState.discs[0]?.pos.x >
          game.ballOutPositionX + THROW_IN_DISTANCE) &&
      game.bringThrowBack == false
    ) {
      game.bringThrowBack = true;
      if (game.outStatus == "redThrow") {
        game.rsTimer = 0;
        game.warningCount++;
        game.outStatus = "blueThrow";
        room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        setTimeout(() => {
          room.setDiscProperties(0, {
            xspeed: 0,
            yspeed: 0,
            color: "0x0fbcf9",
            x: game.ballOutPositionX,
            y: game.throwInPosY,
          });
        }, 100);
      } else if (game.outStatus == "blueThrow") {
        game.rsTimer = 0;
        game.warningCount++;
        game.outStatus = "redThrow";
        room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        setTimeout(() => {
          room.setDiscProperties(0, {
            xspeed: 0,
            yspeed: 0,
            color: "0xff3f34",
            x: game.ballOutPositionX,
            y: game.throwInPosY,
          });
        }, 100);
      }
    }

    if (
      room.gameState.physicsState.discs[0]?.pos.y < 612 &&
      room.gameState.physicsState.discs[0]?.pos.y > -612 &&
      game.throwinKicked == false &&
      game.pushedOut == false
    ) {
      if (game.outStatus == "redThrow") {
        game.rsTimer = 0;
        game.warningCount++;
        game.outStatus = "blueThrow";
        room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        setTimeout(() => {
          room.setDiscProperties(0, {
            xspeed: 0,
            yspeed: 0,
            color: "0x0fbcf9",
            x: game.ballOutPositionX,
            y: game.throwInPosY,
          });
        }, 100);
      } else if (game.outStatus == "blueThrow") {
        game.rsTimer = 0;
        game.warningCount++;
        game.outStatus = "redThrow";
        room.setDiscProperties(3, { x: 0, y: 2000, radius: 0 });
        setTimeout(() => {
          room.setDiscProperties(0, {
            xspeed: 0,
            yspeed: 0,
            color: "0xff3f34",
            x: game.ballOutPositionX,
            y: game.throwInPosY,
          });
        }, 100);
      }
      game.pushedOut = true;
    }

    if (
      room.gameState.physicsState.discs[0]?.pos.y < 612 &&
      room.gameState.physicsState.discs[0]?.pos.y > -612 &&
      game.throwinKicked == true
    ) {
      game.outStatus = "";
      game.rsActive = true;
      game.rsReady = false;
      room.setDiscProperties(0, { color: "0xffffff" });
      game.rsTimer = 1000000;
      game.warningCount++;
    }

    if (
      room.gameState.physicsState.discs[0]?.pos.y.toFixed(1) ==
        game.throwInPosY.toFixed(1) &&
      room.gameState.physicsState.discs[0]?.pos.x.toFixed(1) ==
        game.ballOutPositionX.toFixed(1)
    ) {
      game.bringThrowBack = false;
      game.pushedOut = false;
    }
  }

  // Block throw-in
  blockThrowIn();

  // Block goal kick
  blockGoalKick();

  // Remove block
  removeBlock();

  if (game.time == GAME_TIME * 60 && game.extraTimeAnnounced == false) {
    extraTime();
    game.extraTimeAnnounced = true;
  }

  if (game.time == game.extraTimeEnd && game.lastPlayAnnounced == false) {
    room.sendAnnouncement("📢 ULTIMA JUGADA.", null, null, null, 1);
    game.lastPlayAnnounced = true;
  }
};

const blockThrowIn = () => {
  const players = room.players?.filter((player) => player.team.id != 0);
  if (room.gameState.physicsState.discs[0]?.pos.y < 0) {
    // top throw line
    if (game.outStatus == "redThrow") {
      players?.forEach(function (player) {
        if (player.team.id == 2 && player.disc.pos.y < 0) {
          if (player.disc.cGroup != 536870918) {
            room.setPlayerDiscProperties(player.id, { cGroup: 536870918 });
          }
          if (player.disc.pos.y < -485) {
            room.setPlayerDiscProperties(player.id, { y: -470 });
          }
        }
        if (player.team.id == 1 && player.disc.cGroup != 2) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
        if (room.gameState.physicsState.discs[17].x != 1149) {
          // show top red line
          room.setDiscProperties(17, { x: 1149 });
        }
        if (room.gameState.physicsState.discs[19].x != -1149) {
          // hide top blue line
          room.setDiscProperties(19, { x: -1149 });
        }
      });
    }
    if (game.outStatus == "blueThrow") {
      players?.forEach(function (player) {
        if (player.team.id == 1 && player.disc.pos.y < 0) {
          if (player.disc.cGroup != 536870918) {
            room.setPlayerDiscProperties(player.id, { cGroup: 536870918 });
          }
          if (player.disc.pos.y < -485) {
            room.setPlayerDiscProperties(player.id, { y: -470 });
          }
        }
        if (player.team.id == 2 && player.disc.cGroup != 2) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
        if (room.gameState.physicsState.discs[19].x != 1149) {
          // show top blue line
          room.setDiscProperties(19, { x: 1149 });
        }
        if (room.gameState.physicsState.discs[17].x != -1149) {
          // hide top red line
          room.setDiscProperties(17, { x: -1149 });
        }
      });
    }
  }
  if (room.gameState.physicsState.discs[0]?.pos.y > 0) {
    // bottom throw line
    if (game.outStatus == "redThrow") {
      players?.forEach(function (player) {
        if (player.team.id == 2 && player.disc.pos.y > 0) {
          if (player.disc.cGroup != 536870918) {
            room.setPlayerDiscProperties(player.id, { cGroup: 536870918 });
          }
          if (player.disc.pos.y > 485) {
            room.setPlayerDiscProperties(player.id, { y: 470 });
          }
        }
        if (player.team.id == 1 && player.disc.cGroup != 2) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
        if (room.gameState.physicsState.discs[21].x != 1149) {
          // show bottom red line
          room.setDiscProperties(21, { x: 1149 });
        }
        if (room.gameState.physicsState.discs[23].x != -1149) {
          // hide bottom blue line
          room.setDiscProperties(23, { x: -1149 });
        }
      });
    }
    if (game.outStatus == "blueThrow") {
      players?.forEach(function (player) {
        if (player.team.id == 1 && player.disc.pos.y > 0) {
          if (player.disc.cGroup != 536870918) {
            room.setPlayerDiscProperties(player.id, { cGroup: 536870918 });
          }
          if (player.disc.pos.y > 485) {
            room.setPlayerDiscProperties(player.id, { y: 470 });
          }
        }
        if (player.team.id == 2 && player.disc.cGroup != 2) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
        if (room.gameState.physicsState.discs[23].x != 1149) {
          // show bottom blue line
          room.setDiscProperties(23, { x: 1149 });
        }
        if (room.gameState.physicsState.discs[21].x != -1149) {
          // hide bottom red line
          room.setDiscProperties(21, { x: -1149 });
        }
      });
    }
  }
};

const blockGoalKick = () => {
  const players = room.players?.filter((player) => player.team.id != 0);
  if (room.gameState.physicsState.discs[0]?.pos.x < 0) {
    // left side red goal kick
    if (game.outStatus == "redGK") {
      players?.forEach(function (player) {
        if (player.team.id == 2 && player.disc.pos.x < 0) {
          if (player.disc.cGroup != 268435462) {
            room.setPlayerDiscProperties(player.id, { cGroup: 268435462 });
          }
          if (
            player.disc.pos.x < -840 &&
            player.disc.pos.y > -320 &&
            player.disc.pos.y < 320
          ) {
            room.setPlayerDiscProperties(player.id, { x: -825 });
          }
        }
        if (player.team.id == 1 && player.disc.cGroup != 2) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
      });
    }
  }
  if (room.gameState.physicsState.discs[0]?.pos.x > 0) {
    // right side blue goal kick
    if (game.outStatus == "blueGK") {
      players?.forEach(function (player) {
        if (player.team.id == 1 && player.disc.pos.x > 0) {
          if (player.disc.cGroup != 268435462) {
            room.setPlayerDiscProperties(player.id, { cGroup: 268435462 });
          }
          if (
            player.disc.pos.x > 840 &&
            player.disc.pos.y > -320 &&
            player.disc.pos.y < 320
          ) {
            room.setPlayerDiscProperties(player.id, { x: 825 });
          }
        }
        if (player.team.id == 2 && player.disc.cGroup != 2) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
      });
    }
  }
};

const removeBlock = () => {
  const players = room.players?.filter((player) => player.team.id != 0);
  if (game.outStatus == "") {
    players?.forEach(function (player) {
      if (player.team.id == 1 && player.disc.cGroup != 2) {
        room.setPlayerDiscProperties(player.id, { cGroup: 2 });
      }
      if (player.team.id == 2 && player.disc.cGroup != 4) {
        room.setPlayerDiscProperties(player.id, { cGroup: 4 });
      }
    });
    if (room.gameState.physicsState.discs[17]?.x != -1149) {
      // hide top red line
      room.setDiscProperties(17, { x: -1149 });
    }
    if (room.gameState.physicsState.discs[19]?.x != -1149) {
      // hide top blue line
      room.setDiscProperties(19, { x: -1149 });
    }
    if (room.gameState.physicsState.discs[21]?.x != -1149) {
      // hide bottom red line
      room.setDiscProperties(21, { x: -1149 });
    }
    if (room.gameState.physicsState.discs[23]?.x != -1149) {
      // hide bottom blue line
      room.setDiscProperties(23, { x: -1149 });
    }
  }
};

const extraTime = () => {
  const extraSeconds = Math.ceil(game.extraTimeCount / 60);
  game.extraTimeEnd = GAME_TIME * 60 + extraSeconds;
  room.sendAnnouncement(
    "⏱ TIEMPO EXTRA: " + extraSeconds + " Segundos",
    null,
    null,
    null,
    1
  );
};

const secondsToMinutes = (time) => {
  const mins = ~~((time % 3600) / 60);
  const secs = ~~time % 60;
  return "" + mins + ":" + (secs < 10 ? "0" : "") + secs;
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
  game = new Game();

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

  room.onGameStart = (byPlayer) => {
    game = new Game();
    room.sendAnnouncement(
      "Game started. Time limit: " + GAME_TIME_LIMIT / 60 + " minutes"
    );
  };

  room.onGameStop = (byPlayer) => {
    if (byPlayer) {
      room.sendAnnouncement("Game stopped by " + byPlayer.name);
    }
  };

  room.onPlayerBallKick = (player) => {
    const playerObj = room.players?.filter((p) => p.id === player);
    game.rsTouchTeam = playerObj[0].team?.id;
    game.updateLastKicker(
      player,
      playerObj[0].name,
      playerObj[0].team?.id,
      playerObj[0].avatar
    );

    if (game.rsReady == true) {
      let players = room.players?.filter((player) => player.team.id != 0);
      players?.forEach(function (player) {
        if (room.getPlayerDisc(player.id)?.invMass.toFixed(1) != 0.3) {
          room.setPlayerDiscProperties(player.id, { invMass: 0.3 });
        }
      });
    }

    if (
      game.rsActive == false &&
      game.rsReady == true &&
      (game.rsCorner == true || game.rsGoalKick == true)
    ) {
      game.boosterState = true;
      game.rsActive = true;
      game.rsReady = false;
      room.setDiscProperties(1, { x: 2000, y: 2000 });
      room.setDiscProperties(2, { x: 2000, y: 2000 });
      room.setDiscProperties(0, { color: "0xffffff" });
      game.rsTimer = 1000000;
      game.warningCount++;

      if (game.rsCorner == true) {
        if (room.gameState.physicsState.discs[0].y < 0) {
          room.setDiscProperties(0, {
            xgravity: (room.getPlayerDisc(player)?.speed.x / 35) * -1,
            ygravity: 0.05,
          });
        } else {
          room.setDiscProperties(0, {
            xgravity: (room.getPlayerDisc(player)?.speed.x / 35) * -1,
            ygravity: -0.05,
          });
        }
      }
      if (game.rsGoalKick == true) {
        room.setDiscProperties(0, {
          xgravity: 0,
          ygravity: (room.getPlayerDisc(player)?.speed.y / 40) * -1,
        });
      }

      game.rsCorner = false;
      game.rsGoalKick = false;
      game.outStatus = "";
    }

    if (game.outStatus == "redThrow" || game.outStatus == "blueThrow") {
      game.throwinKicked = true;
    }
  };

  room.onTeamGoal = (team) => {
    game.rsActive = false;

    let goalTime = secondsToMinutes(Math.floor(room.gameState?.timeElapsed));
    let scorer;
    let assister = "";
    let goalType;
    if (team == 1) {
      if (game.lastKickerTeam == 1) {
        goalType = "¡GOOOOOOOOOOOOOOOOLLL!";
        scorer = "⚽ " + game.lastKickerName;
        avatarCelebration(game.lastKickerId, "⚽", game.lastKickerAvatar);
        if (
          game.secondLastKickerTeam == 1 &&
          game.lastKickerId != game.secondLastKickerId
        ) {
          assister = " (Asistencia: " + game.secondLastKickerName + ")";
          avatarCelebration(
            game.secondLastKickerId,
            "🅰️",
            game.secondLastKickerAvatar
          );
        }
      }
      if (game.lastKickerTeam == 2) {
        goalType = "¡Gol en contra!";
        scorer = "⚽ " + game.lastKickerName;
        avatarCelebration(game.lastKickerId, "😭", game.lastKickerAvatar);
        if (game.secondLastKickerTeam == 1) {
          assister = " (Asistencia: " + game.secondLastKickerName + ")";
          avatarCelebration(
            game.secondLastKickerId,
            "🅰️",
            game.secondLastKickerAvatar
          );
        }
      }
      game.redScore++;
    }
    if (team == 2) {
      if (game.lastKickerTeam == 2) {
        goalType = "¡GOOOOOOOOOOOOOOOOLLL!";
        scorer = "⚽ " + game.lastKickerName;
        avatarCelebration(game.lastKickerId, "⚽", game.lastKickerAvatar);
        if (
          game.secondLastKickerTeam == 1 &&
          game.lastKickerId != game.secondLastKickerId
        ) {
          assister = " (Asistencia: " + game.secondLastKickerName + ")";
          avatarCelebration(
            game.secondLastKickerId,
            "🅰️",
            game.secondLastKickerAvatar
          );
        }
      }
      if (game.lastKickerTeam == 1) {
        goalType = "¡Gol en contra!";
        scorer = "⚽ " + game.lastKickerName;
        avatarCelebration(game.lastKickerId, "😭", game.lastKickerAvatar);
        if (game.secondLastKickerTeam == 2) {
          assister = " (Asistencia: " + game.secondLastKickerName + ")";
          avatarCelebration(
            game.secondLastKickerId,
            "🅰️",
            game.secondLastKickerAvatar
          );
        }
      }
      game.redScore++;
    }
    room.sendAnnouncement("[Server] " + goalType, null, 0xb4b4b4, "bold");
    room.sendAnnouncement(
      "[Server] " +
        "🟥 " +
        game.redScore +
        " - " +
        game.blueScore +
        " 🟦 🕒 " +
        goalTime +
        " " +
        scorer +
        assister,
      null,
      0xb4b4b4,
      "bold"
    );
    game.lastKicker = undefined;
    game.secondLastKicker = undefined;
    game.lastKickerTeam = undefined;
    game.secondLastKickerTeam = undefined;
  };

  room.onPositionsReset = () => {
    if (game.lastPlayAnnounced == true) {
      room.pauseGame(true);
      game.lastPlayAnnounced = false;
      room.sendAnnouncement("📢 FIN DEL PARTIDO.");
      room.sendAnnouncement("🎥 La partida ha sido enviada al discord.");
      // Aquí podrías agregar la lógica para enviar la grabación al Discord si lo deseas
    }
  };

  room.onGameTick = () => {
    const scores = room.gameState?.timeElapsed;
    if (scores && scores.time >= GAME_TIME_LIMIT) {
      room.sendAnnouncement("Time limit reached. Resetting the game.");
      balanceTeams();
      resetGame();
    }

    game.updateGameStatus(room);
    handleBallTouch();
    realSoccerRef();
  };

  room.onBeforeOperationReceived = function (
    type,
    msg,
    globalFrameNo,
    clientFrameNo
  ) {
    if (type == OperationType.SendChat) {
      const user_id = msg.byId;
      const text = msg.text;
      // const commandCheck = checkCommand(user_id, text);
      // if (!commandCheck) return false;
      playerManager.handleChat(user_id, text);
      return false;
    }
  };

  room.onOperationReceived = function (type, msg) {
    if (type === OperationType.SendInput) {
      const { kick } = Utils.reverseKeyState(msg.input);
      const playerId = msg.byId;
      const currentTime = Date.now();

      if (kick) {
        if (!kickTimers[playerId]) {
          kickTimers[playerId] = setTimeout(() => {
            if (Utils.reverseKeyState(room.getPlayer(playerId).input).kick) {
              if (
                !lastActionExecution[playerId] ||
                currentTime - lastActionExecution[playerId] > COOLDOWN_TIME
              ) {
                lastActionExecution[playerId] = currentTime;

                // Execute the slide action
                const player = room.getPlayer(playerId);
                makePlayerSlide(player);
              } else {
                const remainingCooldown = Math.ceil(
                  (COOLDOWN_TIME -
                    (currentTime - lastActionExecution[playerId])) /
                    1000
                );
                room.sendAnnouncement(
                  `[Server] Espera ${remainingCooldown} segundos para volver a deslizarte.`,
                  playerId,
                  0xb4b4b4,
                  "normal",
                  2
                );
              }
            }
            kickTimers[playerId] = null;
          }, HOLD_DURATION);
        }
      } else {
        // If kick is released, clear the timer
        if (kickTimers[playerId]) {
          clearTimeout(kickTimers[playerId]);
          kickTimers[playerId] = null;
        }
      }
    }
    return true;
  };

  // Add these constants near the top of your file
  const COLLISION_THRESHOLD = 5; // Minimum speed for a foul
  const SEVERE_FOUL_THRESHOLD = 15; // Speed threshold for a red card
  const BALL_TOUCH_WINDOW = 500; // 0.5 seconds in milliseconds
  const YELLOW_CARD_LIMIT = 2; // Number of yellow cards before a red card

  const playerCards = {};

  // Add this function to check for fouls during slides
  const checkForFoul = (slidingPlayer, collidedPlayer, collisionSpeed) => {
    const currentTime = Date.now();

    // Check if the sliding player touched the ball recently
    if (
      currentTime - game.lastBallTouch[slidingPlayer.id] >
      BALL_TOUCH_WINDOW
    ) {
      // It's a foul
      if (collisionSpeed >= COLLISION_THRESHOLD) {
        if (!playerCards[slidingPlayer.id]) {
          playerCards[slidingPlayer.id] = { yellow: 0, red: 0 };
        }

        if (collisionSpeed >= SEVERE_FOUL_THRESHOLD) {
          // Red card for severe foul
          playerCards[slidingPlayer.id].red++;
          room.sendAnnouncement(
            `🟥 ${slidingPlayer.name} recibe tarjeta roja por falta grave!`,
            null,
            0xff4136,
            "bold"
          );
          kickPlayer(slidingPlayer.id);
        } else {
          // Yellow card for regular foul
          playerCards[slidingPlayer.id].yellow++;
          room.sendAnnouncement(
            `🟨 ${slidingPlayer.name} recibe tarjeta amarilla por falta!`,
            null,
            0xffdc00,
            "bold"
          );

          if (playerCards[slidingPlayer.id].yellow >= YELLOW_CARD_LIMIT) {
            playerCards[slidingPlayer.id].red++;
            room.sendAnnouncement(
              `🟥 ${slidingPlayer.name} recibe tarjeta roja por acumulación de amarillas!`,
              null,
              0xff4136,
              "bold"
            );
            kickPlayer(slidingPlayer.id);
          }
        }

        // Announce the foul
        room.sendAnnouncement(
          `Falta de ${slidingPlayer.name} sobre ${collidedPlayer.name}!`,
          null,
          0xffffff,
          "normal"
        );
      }
    }
  };

  const kickPlayer = (playerId) => {
    // Move player to spectator instead of kicking
    room.setPlayerTeam(playerId, 0);
    room.sendAnnouncement(
      `🟥 ${
        room.getPlayer(playerId).name
      } ha sido expulsado y movido a espectador.`,
      null,
      0xff4136,
      "bold"
    );
  };

  // Modify the makePlayerSlide function to include collision detection
  function makePlayerSlide(player) {
    if (!player) return;
    const playerAvatar = player.avatar;

    const originalDisc = room.getPlayerDisc(player.id);
    if (!originalDisc || !originalDisc.speed) {
      console.warn(`Player ${player.id} disc or speed not found`);
      return;
    }

    const startSpeed = {
      xspeed: originalDisc.speed.x * SLIDE_SPEED_MULTIPLIER,
      yspeed: originalDisc.speed.y * SLIDE_SPEED_MULTIPLIER,
    };
    const slowSpeed = {
      xspeed: originalDisc.speed.x * SLOW_SPEED,
      yspeed: originalDisc.speed.y * SLOW_SPEED,
    };

    room.setPlayerDiscProperties(player.id, startSpeed);
    room.setPlayerAvatar(player.id, "👟");

    const decelerationDuration = 700;
    const slowDuration = 4000;
    const accelerationDuration = 1000; // Exactamente 1 segundo
    const totalDuration =
      decelerationDuration + slowDuration + accelerationDuration;
    const startTime = Date.now();

    const updateInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / totalDuration, 1);

      let currentSpeed;
      if (elapsedTime < decelerationDuration) {
        const decelerationProgress = elapsedTime / decelerationDuration;
        currentSpeed = {
          xspeed:
            startSpeed.xspeed +
            (slowSpeed.xspeed - startSpeed.xspeed) * decelerationProgress,
          yspeed:
            startSpeed.yspeed +
            (slowSpeed.yspeed - startSpeed.yspeed) * decelerationProgress,
        };
      } else if (elapsedTime < decelerationDuration + slowDuration) {
        const currentDisc = room.getPlayerDisc(player.id);
        currentSpeed = {
          xspeed: currentDisc.speed.x * 0.3,
          yspeed: currentDisc.speed.y * 0.3,
        };
      } else {
        const accelerationProgress = Math.min(
          (elapsedTime - decelerationDuration - slowDuration) /
            accelerationDuration,
          1
        );
        currentSpeed = {
          xspeed:
            slowSpeed.xspeed +
            (originalDisc.speed.x - slowSpeed.xspeed) * accelerationProgress,
          yspeed:
            slowSpeed.yspeed +
            (originalDisc.speed.y - slowSpeed.yspeed) * accelerationProgress,
        };
      }

      room.setPlayerDiscProperties(player.id, currentSpeed);

      // Check for collisions with other players
      const players = room.players?.filter((p) => p.team.id != 0);
      if (players && players.length > 1) {
        for (let otherPlayer of players) {
          if (otherPlayer.id !== player.id) {
            const playerDisc = room.getPlayerDisc(player.id);
            const otherPlayerDisc = room.getPlayerDisc(otherPlayer.id);

            // Check if both player discs exist before calculating distance
            if (
              playerDisc &&
              otherPlayerDisc &&
              playerDisc.pos &&
              otherPlayerDisc.pos
            ) {
              const distance = pointDistance(
                playerDisc.pos,
                otherPlayerDisc.pos
              );
              const collisionSpeed = Math.sqrt(
                currentSpeed.xspeed ** 2 + currentSpeed.yspeed ** 2
              );

              if (
                distance <
                (playerDisc.radius || 0) + (otherPlayerDisc.radius || 0)
              ) {
                checkForFoul(player, otherPlayer, collisionSpeed);
              }
            }
          }
        }
      }

      if (progress >= 1) {
        clearInterval(updateInterval);
        room.setPlayerDiscProperties(player.id, {
          xspeed: originalDisc.speed.x,
          yspeed: originalDisc.speed.y,
        });
        room.setPlayerAvatar(player.id, playerAvatar);
      }
    }, 16);

    setTimeout(() => {
      clearInterval(updateInterval);
      room.setPlayerDiscProperties(player.id, {
        xspeed: originalDisc.speed.x,
        yspeed: originalDisc.speed.y,
      });
      room.setPlayerAvatar(player.id, playerAvatar);
    }, totalDuration + 100); // Pequeño buffer añadido
  }

  // Add this to track when players last touched the ball
  game.lastBallTouch = {};

  // Modify the handleBallTouch function to update lastBallTouch
  const handleBallTouch = () => {
    const players = room.players;
    const ballPosition = room.gameState?.physicsState?.discs[0]?.pos;
    const ballRadius = game.ballRadius;
    const playerRadius = 15;
    const triggerDistance = ballRadius + playerRadius + 0.01;

    if (!ballPosition) {
      console.warn("Ball position is undefined");
      return;
    }

    for (let i = 0; i < players?.length; i++) {
      let player = players[i];
      if (!player || !player.disc || !player.disc.pos) continue;

      const distanceToBall = pointDistance(player.disc.pos, ballPosition);
      if (distanceToBall < triggerDistance) {
        game.rsTouchTeam = player.team.id;
        game.throwinKicked = false;

        // Initialize lastBallTouch for this player if it doesn't exist
        if (!game.lastBallTouch[player.id]) {
          game.lastBallTouch[player.id] = 0;
        }
        game.lastBallTouch[player.id] = Date.now();

        if (
          game.rsCorner == false &&
          room.gameState?.physicsState?.discs[0]?.gravity?.x != 0
        ) {
          room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });
          game.rsSwingTimer = 10000;
        }
      }
    }
  };
  balanceTeams();
  resetGame();
};

module.exports = {
  initializeTriggerActions,
  balanceTeams,
};
