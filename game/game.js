class Game {
  constructor() {
    this.ticks = 0;
    this.time = 0;
    this.active = true;
    this.paused = false;
    this.ballRadius;
    this.rsTouchTeam = 0;
    this.rsActive = true;
    this.rsReady = false;
    this.rsCorner = false;
    this.rsGoalKick = false;
    this.rsSwingTimer = 1000;
    this.rsTimer;
    this.ballOutPositionX;
    this.ballOutPositionY;
    this.throwInPosY;
    this.outStatus = "";
    this.warningCount = 0;
    this.bringThrowBack = false;
    this.extraTime = false;
    this.extraTimeCount = 0;
    this.extraTimeEnd;
    this.extraTimeAnnounced = false;
    this.lastPlayAnnounced = false;
    this.boosterState;
    this.throwinKicked = false;
    this.pushedOut;
    this.lastKickerId;
    this.lastKickerName;
    this.lastKickerTeam;
    this.lastKickerAvatar;
    this.secondLastKickerId;
    this.secondLastKickerName;
    this.secondLastKickerTeam;
    this.secondLastKickerAvatar;
    this.redScore = 0;
    this.blueScore = 0;
    this.lastBallTouch = {};
  }

  updateLastKicker(id, name, team, avatar) {
    this.secondLastKickerId = this.lastKickerId;
    this.secondLastKickerName = this.lastKickerName;
    this.secondLastKickerTeam = this.lastKickerTeam;
    this.secondLastKickerAvatar = this.lastKickerAvatar;

    this.lastKickerId = id;
    this.lastKickerName = name;
    this.lastKickerTeam = team;
    this.lastKickerAvatar = avatar;
  }

  updateGameStatus(room) {
    this.time = Math.floor(room.gameState?.timeElapsed);
    this.ballRadius = room.gameState?.physicsState.discs[0]?.radius;
    this.ticks++;
  }
}

function pointDistance(p1, p2) {
  const d1 = p1.x - p2.x;
  const d2 = p1.y - p2.y;
  return Math.sqrt(d1 * d1 + d2 * d2);
}

module.exports = {
  Game,
  pointDistance,
};
