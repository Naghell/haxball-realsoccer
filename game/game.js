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
    this.secondLastKickerId;
    this.secondLastKickerName;
    this.secondLastKickerTeam;
    this.redScore = 0;
    this.blueScore = 0;
  }

  updateLastKicker(id, name, team) {
    this.secondLastKickerId = this.lastKickerId;
    this.secondLastKickerName = this.lastKickerName;
    this.secondLastKickerTeam = this.lastKickerTeam;

    this.lastKickerId = id;
    this.lastKickerName = name;
    this.lastKickerTeam = team;
  }

  updateGameStatus(room) {
    this.time = Math.floor(room.getScores().time);
    this.ballRadius = room.getDiscProperties(0).radius;
    this.ticks++;
  }

  handleBallTouch(room) {
    const players = room.getPlayerList();
    const ballPosition = room.getBallPosition();
    const playerRadius = 15;
    const triggerDistance = this.ballRadius + playerRadius + 0.01;

    for (const player of players) {
      if (player.position == null) continue;
      const distanceToBall = pointDistance(player.position, ballPosition);
      if (distanceToBall < triggerDistance) {
        this.rsTouchTeam = player.team;
        this.throwinKicked = false;

        if (this.rsCorner == false && room.getDiscProperties(0).xgravity != 0) {
          room.setDiscProperties(0, { xgravity: 0, ygravity: 0 });
          this.rsSwingTimer = 10000;
        }
      }
    }
  }

  realSoccerRef(room) {
    // Implement the real soccer referee logic here
    // This function should handle throw-ins, goal kicks, corners, etc.
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
