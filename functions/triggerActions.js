const stadiumConfig = require("../systems/stadium");
const { Game, pointDistance } = require("../game/game");

let room;
let playerManager;
let game;

const GAME_TIME_LIMIT = 5 * 60; // 5 minutes in seconds
const SCORE_LIMIT = 5;
const MAX_PLAYERS_PER_TEAM = 6;
const GAME_TIME = 5;
const THROW_TIMEOUT = 420; // 7 seconds (var is in game ticks)
const GK_TIMEOUT = 600; // 10 seconds (var is in game ticks)
const CK_TIMEOUT = 600; // 10 seconds (var is in game ticks)
const THROW_IN_DISTANCE = 270; // distance players can move the ball during throw in

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

const avatarCelebration = (playerId, avatar) => {
  room.setPlayerAvatar(playerId, avatar);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, null);
  }, 250);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 500);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, null);
  }, 750);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 1000);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, null);
  }, 1250);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 1500);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, null);
  }, 1750);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 2000);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, null);
  }, 2250);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 2500);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, null);
  }, 2750);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, avatar);
  }, 3000);
  setTimeout(() => {
    room.setPlayerAvatar(playerId, null);
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
    if (room.getBallPosition().y > 612 || room.getBallPosition().y < -612) {
      game.rsActive = false;
      if (game.lastPlayAnnounced == true) {
        room.pauseGame(true);
        game.lastPlayAnnounced = false;
        room.sendAnnouncement("📢 FIN DEL PARTIDO.");
        room.sendAnnouncement("🎥 La partida ha sido enviada al discord.");
      }

      room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });

      game.ballOutPositionX = Math.round(room.getBallPosition().x * 10) / 10;
      if (room.getBallPosition().y > 612) {
        game.ballOutPositionY = 400485;
        game.throwInPosY = 618;
      }
      if (room.getBallPosition().y < -612) {
        game.ballOutPositionY = -400485;
        game.throwInPosY = -618;
      }
      if (room.getBallPosition().x > 1130) {
        game.ballOutPositionX = 1130;
      }
      if (room.getBallPosition().x < -1130) {
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
        xgravity: room.getDiscProperties(0).xgravity * 0.97,
        ygravity: room.getDiscProperties(0).ygravity * 0.97,
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

  if (room.getBallPosition().x == 0 && room.getBallPosition().y == 0) {
    game.rsActive = true;
    game.outStatus = "";
  }

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
    if (room.getBallPosition().y > 612 || room.getBallPosition().y < -612) {
      game.rsActive = false;
      if (game.lastPlayAnnounced == true) {
        room.pauseGame(true);
        game.lastPlayAnnounced = false;
        room.sendAnnouncement("📢 FIN DEL PARTIDO.");
        room.sendAnnouncement("🎥 La partida ha sido enviada al discord.");
      }

      room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });

      game.ballOutPositionX = Math.round(room.getBallPosition().x * 10) / 10;
      if (room.getBallPosition().y > 612) {
        game.ballOutPositionY = 400485;
        game.throwInPosY = 618;
      }
      if (room.getBallPosition().y < -612) {
        game.ballOutPositionY = -400485;
        game.throwInPosY = -618;
      }
      if (room.getBallPosition().x > 1130) {
        game.ballOutPositionX = 1130;
      }
      if (room.getBallPosition().x < -1130) {
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
      room.getBallPosition().x > 1162 &&
      (room.getBallPosition().y > 124 || room.getBallPosition().y < -124)
    ) {
      game.rsActive = false;
      if (game.lastPlayAnnounced == true) {
        room.pauseGame(true);
        game.lastPlayAnnounced = false;
        room.sendAnnouncement("📢 FIN DEL PARTIDO.");
        room.sendAnnouncement("🎥 La partida ha sido enviada al discord.");
      }
      room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });
      room.getPlayerList().forEach(function (player) {
        room.setPlayerDiscProperties(player.id, { invMass: 100000 });
      });

      if (game.rsTouchTeam == 1) {
        room.setDiscProperties(3, { x: 1060, y: 0, radius: 18 });
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
        if (room.getBallPosition().y < -124) {
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
        if (room.getBallPosition().y > 124) {
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
      room.getBallPosition().x < -1162 &&
      (room.getBallPosition().y > 124 || room.getBallPosition().y < -124)
    ) {
      game.rsActive = false;
      if (game.lastPlayAnnounced == true) {
        room.pauseGame(true);
        game.lastPlayAnnounced = false;
        room.sendAnnouncement("📢 FIN DEL PARTIDO.");
        room.sendAnnouncement("🎥 La partida ha sido enviada al discord.");
      }
      room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });
      room.getPlayerList().forEach(function (player) {
        room.setPlayerDiscProperties(player.id, { invMass: 100000 });
      });

      if (game.rsTouchTeam == 1) {
        game.rsSwingTimer = 0;
        if (room.getBallPosition().y < -124) {
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
        if (room.getBallPosition().y > 124) {
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
      (room.getBallPosition().y > 612 || room.getBallPosition().y < -612) &&
      (room.getBallPosition().x < game.ballOutPositionX - THROW_IN_DISTANCE ||
        room.getBallPosition().x > game.ballOutPositionX + THROW_IN_DISTANCE) &&
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
      room.getBallPosition().y < 612 &&
      room.getBallPosition().y > -612 &&
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
      room.getBallPosition().y < 612 &&
      room.getBallPosition().y > -612 &&
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
      room.getBallPosition().y.toFixed(1) == game.throwInPosY.toFixed(1) &&
      room.getBallPosition().x.toFixed(1) == game.ballOutPositionX.toFixed(1)
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
  const players = room.getPlayerList().filter((player) => player.team != 0);
  if (room.getBallPosition().y < 0) {
    // top throw line
    if (game.outStatus == "redThrow") {
      players.forEach(function (player) {
        if (player.team == 2 && room.getPlayerDiscProperties(player.id).y < 0) {
          if (room.getPlayerDiscProperties(player.id).cGroup != 536870918) {
            room.setPlayerDiscProperties(player.id, { cGroup: 536870918 });
          }
          if (player.position.y < -485) {
            room.setPlayerDiscProperties(player.id, { y: -470 });
          }
        }
        if (
          player.team == 1 &&
          room.getPlayerDiscProperties(player.id).cGroup != 2
        ) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
        if (room.getDiscProperties(17).x != 1149) {
          // show top red line
          room.setDiscProperties(17, { x: 1149 });
        }
        if (room.getDiscProperties(19).x != -1149) {
          // hide top blue line
          room.setDiscProperties(19, { x: -1149 });
        }
      });
    }
    if (game.outStatus == "blueThrow") {
      players.forEach(function (player) {
        if (player.team == 1 && room.getPlayerDiscProperties(player.id).y < 0) {
          if (room.getPlayerDiscProperties(player.id).cGroup != 536870918) {
            room.setPlayerDiscProperties(player.id, { cGroup: 536870918 });
          }
          if (player.position.y < -485) {
            room.setPlayerDiscProperties(player.id, { y: -470 });
          }
        }
        if (
          player.team == 2 &&
          room.getPlayerDiscProperties(player.id).cGroup != 2
        ) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
        if (room.getDiscProperties(19).x != 1149) {
          // show top blue line
          room.setDiscProperties(19, { x: 1149 });
        }
        if (room.getDiscProperties(17).x != -1149) {
          // hide top red line
          room.setDiscProperties(17, { x: -1149 });
        }
      });
    }
  }
  if (room.getBallPosition().y > 0) {
    // bottom throw line
    if (game.outStatus == "redThrow") {
      players.forEach(function (player) {
        if (player.team == 2 && room.getPlayerDiscProperties(player.id).y > 0) {
          if (room.getPlayerDiscProperties(player.id).cGroup != 536870918) {
            room.setPlayerDiscProperties(player.id, { cGroup: 536870918 });
          }
          if (player.position.y > 485) {
            room.setPlayerDiscProperties(player.id, { y: 470 });
          }
        }
        if (
          player.team == 1 &&
          room.getPlayerDiscProperties(player.id).cGroup != 2
        ) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
        if (room.getDiscProperties(21).x != 1149) {
          // show bottom red line
          room.setDiscProperties(21, { x: 1149 });
        }
        if (room.getDiscProperties(23).x != -1149) {
          // hide bottom blue line
          room.setDiscProperties(23, { x: -1149 });
        }
      });
    }
    if (game.outStatus == "blueThrow") {
      players.forEach(function (player) {
        if (player.team == 1 && room.getPlayerDiscProperties(player.id).y > 0) {
          if (room.getPlayerDiscProperties(player.id).cGroup != 536870918) {
            room.setPlayerDiscProperties(player.id, { cGroup: 536870918 });
          }
          if (player.position.y > 485) {
            room.setPlayerDiscProperties(player.id, { y: 470 });
          }
        }
        if (
          player.team == 2 &&
          room.getPlayerDiscProperties(player.id).cGroup != 2
        ) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
        if (room.getDiscProperties(23).x != 1149) {
          // show bottom blue line
          room.setDiscProperties(23, { x: 1149 });
        }
        if (room.getDiscProperties(21).x != -1149) {
          // hide bottom red line
          room.setDiscProperties(21, { x: -1149 });
        }
      });
    }
  }
};

const blockGoalKick = () => {
  const players = room.getPlayerList().filter((player) => player.team != 0);
  if (room.getBallPosition().x < 0) {
    // left side red goal kick
    if (game.outStatus == "redGK") {
      players.forEach(function (player) {
        if (player.team == 2 && room.getPlayerDiscProperties(player.id).x < 0) {
          if (room.getPlayerDiscProperties(player.id).cGroup != 268435462) {
            room.setPlayerDiscProperties(player.id, { cGroup: 268435462 });
          }
          if (
            player.position.x < -840 &&
            player.position.y > -320 &&
            player.position.y < 320
          ) {
            room.setPlayerDiscProperties(player.id, { x: -825 });
          }
        }
        if (
          player.team == 1 &&
          room.getPlayerDiscProperties(player.id).cGroup != 2
        ) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
      });
    }
  }
  if (room.getBallPosition().x > 0) {
    // right side blue goal kick
    if (game.outStatus == "blueGK") {
      players.forEach(function (player) {
        if (player.team == 1 && room.getPlayerDiscProperties(player.id).x > 0) {
          if (room.getPlayerDiscProperties(player.id).cGroup != 268435462) {
            room.setPlayerDiscProperties(player.id, { cGroup: 268435462 });
          }
          if (
            player.position.x > 840 &&
            player.position.y > -320 &&
            player.position.y < 320
          ) {
            room.setPlayerDiscProperties(player.id, { x: 825 });
          }
        }
        if (
          player.team == 2 &&
          room.getPlayerDiscProperties(player.id).cGroup != 2
        ) {
          room.setPlayerDiscProperties(player.id, { cGroup: 2 });
        }
      });
    }
  }
};

const removeBlock = () => {
  const players = room.getPlayerList().filter((player) => player.team != 0);
  if (game.outStatus == "") {
    players.forEach(function (player) {
      if (
        player.team == 1 &&
        room.getPlayerDiscProperties(player.id).cGroup != 2
      ) {
        room.setPlayerDiscProperties(player.id, { cGroup: 2 });
      }
      if (
        player.team == 2 &&
        room.getPlayerDiscProperties(player.id).cGroup != 4
      ) {
        room.setPlayerDiscProperties(player.id, { cGroup: 4 });
      }
    });
    if (room.getDiscProperties(17).x != -1149) {
      // hide top red line
      room.setDiscProperties(17, { x: -1149 });
    }
    if (room.getDiscProperties(19).x != -1149) {
      // hide top blue line
      room.setDiscProperties(19, { x: -1149 });
    }
    if (room.getDiscProperties(21).x != -1149) {
      // hide bottom red line
      room.setDiscProperties(21, { x: -1149 });
    }
    if (room.getDiscProperties(23).x != -1149) {
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

const handleBallTouch = () => {
  const players = room.getPlayerList();
  const ballPosition = room.getBallPosition();
  const ballRadius = game.ballRadius;
  const playerRadius = 15;
  const triggerDistance = ballRadius + playerRadius + 0.01;

  for (let i = 0; i < players.length; i++) {
    let player = players[i];
    if (player.position == null) continue;
    const distanceToBall = pointDistance(player.position, ballPosition);
    if (distanceToBall < triggerDistance) {
      game.rsTouchTeam = player.team;
      game.throwinKicked = false;

      if (game.rsCorner == false && room.getDiscProperties(0).xgravity != 0) {
        room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });
        game.rsSwingTimer = 10000;
      }
    }
  }
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
    game.rsTouchTeam = player.team;
    game.updateLastKicker(player.id, player.name, player.team);

    if (game.rsReady == true) {
      var players = room.getPlayerList().filter((player) => player.team != 0);
      players.forEach(function (player) {
        if (room.getPlayerDiscProperties(player.id).invMass.toFixed(1) != 0.3) {
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
        if (room.getDiscProperties(0).y < 0) {
          room.setDiscProperties(0, {
            xgravity:
              (room.getPlayerDiscProperties(player.id).xspeed / 35) * -1,
            ygravity: 0.05,
          });
        } else {
          room.setDiscProperties(0, {
            xgravity:
              (room.getPlayerDiscProperties(player.id).xspeed / 35) * -1,
            ygravity: -0.05,
          });
        }
      }
      if (game.rsGoalKick == true) {
        room.setDiscProperties(0, {
          xgravity: 0,
          ygravity: (room.getPlayerDiscProperties(player.id).yspeed / 40) * -1,
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

    let goalTime = secondsToMinutes(Math.floor(room.getScores().time));
    let scorer;
    let assister = "";
    let goalType;
    if (team == 1) {
      if (game.lastKickerTeam == 1) {
        goalType = "GOL!";
        scorer = "⚽ Gol de " + game.lastKickerName;
        avatarCelebration(game.lastKickerId, "⚽");
        if (
          game.secondLastKickerTeam == 1 &&
          game.lastKickerId != game.secondLastKickerId
        ) {
          assister = " (Asistencia: " + game.secondLastKickerName + ")";
          avatarCelebration(game.secondLastKickerId, "🅰️");
        }
      }
      if (game.lastKickerTeam == 2) {
        goalType = "AUTOGOL!";
        scorer = "⚽ Autogol de" + game.lastKickerName;
        avatarCelebration(game.lastKickerId, "😭");
        if (game.secondLastKickerTeam == 1) {
          assister = " (Asistencia: " + game.secondLastKickerName + ")";
          avatarCelebration(game.secondLastKickerId, "🅰️");
        }
      }
      game.redScore++;
    }
    if (team == 2) {
      // ... [Lógica similar para el equipo azul]
    }
    room.sendAnnouncement(
      goalType +
        " 🟥 " +
        game.redScore +
        " - " +
        game.blueScore +
        " 🟦 🕒" +
        goalTime +
        " " +
        scorer +
        assister
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
      room.sendAnnouncement("🎥 La partida a sido enviada al discord.");
      // Aquí podrías agregar la lógica para enviar la grabación al Discord si lo deseas
    }
  };

  room.onGameTick = () => {
    const scores = room.getScores();
    if (scores && scores.time >= GAME_TIME_LIMIT) {
      room.sendAnnouncement("Time limit reached. Resetting the game.");
      balanceTeams();
      resetGame();
    }
    game.updateGameStatus(room);
    handleBallTouch();
    realSoccerRef();
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
