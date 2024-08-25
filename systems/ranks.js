const supabase = require("../database/db");

let ELO_RANKS = {};
let STAFF_RANKS = {};

async function loadRanks(serverId) {
  try {
    const { data: eloRanks, error: eloError } = await supabase
      .from("elo_ranks")
      .select("*")
      .eq("server_id", serverId);
    if (eloError) throw eloError;

    const { data: staffRanks, error: staffError } = await supabase
      .from("staff_ranks")
      .select("*")
      .eq("server_id", serverId);
    if (staffError) throw staffError;

    ELO_RANKS = eloRanks.reduce((acc, rank) => {
      acc[rank.id] = {
        name: rank.name,
        min_elo: rank.min_elo,
        max_elo: rank.max_elo,
        color: rank.color,
        style: rank.style,
      };
      return acc;
    }, {});

    STAFF_RANKS = staffRanks.reduce((acc, rank) => {
      acc[rank.id] = {
        name: rank.name,
        value: rank.value,
        color: rank.color,
        style: rank.style,
      };
      return acc;
    }, {});

    console.log("Ranks loaded successfully");
  } catch (error) {
    console.error("Error loading ranks:", error);
  }
}

function getRankInfo(rankId, isStaff = false) {
  const ranks = isStaff ? STAFF_RANKS : ELO_RANKS;
  return ranks[rankId] || { color: 0xffffff, style: "normal" };
}

function getEloRankInfo(elo) {
  const eloRank = Object.values(ELO_RANKS).find(
    (rank) => elo >= rank.min_elo && elo <= rank.max_elo
  );

  if (eloRank) {
    return {
      name: eloRank.name,
      color: eloRank.color,
      style: eloRank.style,
    };
  } else {
    return {
      name: `${elo} ELO`,
      color: 0xffffff,
      style: "normal",
    };
  }
}

async function getPlayerDisplayInfo(player) {
  let rankString = "";
  let color = 0xffffff;
  let style = "normal";
  let vipPrefix = "";

  if (player.isRegistered) {
    if (player.staff_rank_id) {
      const staffRank = STAFF_RANKS[player.staff_rank_id];
      if (staffRank) {
        rankString = staffRank.name;
        color = staffRank.color;
        style = staffRank.style;
      }
    } else {
      const eloRank = Object.values(ELO_RANKS).find(
        (rank) => player.elo >= rank.min_elo && player.elo <= rank.max_elo
      );
      if (eloRank) {
        rankString = eloRank.name;
        color = eloRank.color;
        style = eloRank.style;
      } else {
        rankString = `${player.elo} ELO`;
      }
    }

    if (player.vip) {
      vipPrefix = "⭐ ";
    }
  }

  return { rankString, color, style, vipPrefix };
}

module.exports = {
  loadRanks,
  getRankInfo,
  getPlayerDisplayInfo,
  getEloRankInfo,
  ELO_RANKS,
  STAFF_RANKS,
};
