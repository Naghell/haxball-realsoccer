const supabase = require("../database/db");
const { ELO_RANKS, STAFF_RANKS } = require("../systems/ranks");

class Player {
  constructor(data) {
    // Player table fields
    this.id = data.id || null;
    this.auth = data.auth || null;
    this.name = data.name;
    this.password = data.password || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.muted = data.muted || false;
    this.banned = data.banned || false;

    // player_server_data fields
    this.serverId = data.serverId;
    this.elo = data.elo || -1;
    this.games_played = data.games_played || 0;
    this.staff_rank_id = data.staff_rank_id || null;
    this.vip = data.vip || false;
    this.wins = data.wins || 0;
    this.losses = data.losses || 0;
    this.promotion = data.promotion || false;
    this.promotion_wins = data.promotion_wins || 0;

    // Server-side auth checks (not stored in DB)
    this.isRegistered = false;
    this.isLogged = false;
    this.nativeId = data.nativeId || null;
  }

  async save() {
    if (!this.isRegistered) {
      console.log(`Player ${this.name} is not registered. Skipping save.`);
      return;
    }

    const playerData = {
      id: this.id,
      auth: this.auth,
      name: this.name,
      password: this.password,
      muted: this.muted,
      banned: this.banned,
      updated_at: new Date(),
    };

    const serverData = {
      player_id: this.id,
      server_id: this.serverId,
      elo: this.elo,
      games_played: this.games_played,
      staff_rank_id: this.staff_rank_id,
      vip: this.vip,
      wins: this.wins,
      losses: this.losses,
      promotion: this.promotion,
      promotion_wins: this.promotion_wins,
      updated_at: new Date(),
    };

    const { error: playerError } = await supabase
      .from("players")
      .upsert(playerData);

    if (playerError) throw playerError;

    const { error: serverDataError } = await supabase
      .from("player_server_data")
      .upsert(serverData);

    if (serverDataError) throw serverDataError;
  }

  getEloRank() {
    if (!this.isRegistered || this.elo === null || this.games_played < 10) {
      return "UNRANKED";
    }
    for (const [rank, range] of Object.entries(ELO_RANKS)) {
      if (this.elo >= range.min_elo && this.elo <= range.max_elo) {
        return rank;
      }
    }
    return "UNRANKED";
  }

  async updateElo(newElo) {
    if (!this.isRegistered || !this.isLogged) {
      console.log(
        `Player ${this.name} is not registered or logged in. Skipping ELO update.`
      );
      return;
    }
    this.elo = newElo;
    this.games_played++;
    await this.save();
  }

  async setStaffRank(rankId) {
    if (!this.isRegistered || !this.isLogged) {
      console.log(
        `Player ${this.name} is not registered or logged in. Skipping staff rank update.`
      );
      return;
    }
    this.staff_rank_id = rankId;
    await this.save();
  }

  async setVIP(status) {
    if (!this.isRegistered || !this.isLogged) {
      console.log(
        `Player ${this.name} is not registered or logged in. Skipping VIP status update.`
      );
      return;
    }
    this.vip = status;
    await this.save();
  }

  async updateStats(didWin) {
    if (!this.isRegistered || !this.isLogged) {
      console.log(
        `Player ${this.name} is not registered or logged in. Skipping stats update.`
      );
      return;
    }
    if (didWin) {
      this.wins++;
    } else {
      this.losses++;
    }
    await this.save();
  }

  getRankString() {
    let ranks = [this.getEloRank()];
    if (this.staff_rank_id) ranks.unshift(STAFF_RANKS[this.staff_rank_id].name);
    if (this.vip) ranks.push("VIP");
    return ranks.join(" | ");
  }

  update(data) {
    Object.assign(this, data);
  }

  setRegistered(status) {
    this.isRegistered = status;
  }

  setLogged(status) {
    this.isLogged = status;
  }
}

module.exports = Player;
