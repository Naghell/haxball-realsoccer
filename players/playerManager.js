const supabase = require("../database/db");
const { balanceTeams } = require("../functions/triggerActions");
const { getPlayerDisplayInfo, getEloRankInfo } = require("../systems/ranks");
const Player = require("./player");

class PlayerManager {
  constructor(room, serverId) {
    this.room = room;
    this.serverId = serverId;
    this.players = new Map();
  }

  async handlePlayerJoin(playerInfo) {
    const existingPlayerData = await this.fetchPlayerData(playerInfo.name);
    const player = new Player({
      ...existingPlayerData,
      name: playerInfo.name,
      auth: playerInfo.auth,
      serverId: this.serverId,
      id: playerInfo.id,
    });
    this.players.set(playerInfo.name, player);

    await this.sendWelcomeMessage(playerInfo);
    await this.checkExistingPlayerAndNotify(playerInfo);

    // Set a 30-second timer for login
    this.setLoginTimer(player);
  }

  setLoginTimer(player) {
    setTimeout(() => {
      if (!player.isLogged) {
        this.room.kickPlayer(
          player.id,
          "No te has logueado en 30 segundos.",
          false
        );
      }
    }, 30000);
  }

  async sendWelcomeMessage(player) {
    const existingPlayer = await this.checkExistingPlayer(player.name);
    if (existingPlayer) {
      const playerObj = this.getPlayer(player.name);
      playerObj.update({
        ...existingPlayer,
        isRegistered: true,
      });
      this.room.sendAnnouncement(
        `\n\n\n\n` + // Espacio en blanco para centrar
          `[Server] 👋 ¡Bienvenido a la comunidad Naghello!\n` +
          `[Server] Tu cuenta está registrada: ${playerObj?.name} (ELO: ${playerObj.elo}).\n\n` +
          `[Server] Usa !info para ver la información del servidor.\n` +
          `[Server] Para ver las notas del parche más reciente (1.0.0), visita: ds.naghell.com\n` +
          `[Server] Puedes ver tus estadísticas en la web, visita: hax.naghell.com\n\n`,
        player.id,
        0xb4b4b4, // Color gris claro
        "normal",
        2
      );
    } else {
      this.room.sendAnnouncement(
        `\n\n\n\n` + // Espacio en blanco para centrar
          `[Server] 👋 ¡Bienvenido a la comunidad Naghello!\n` +
          `[Server] Usa !info para ver la información del servidor.\n` +
          `[Server] Para ver las notas del parche más reciente (1.0.0), visita: ds.naghell.com\n` +
          `[Server] Puedes ver tus estadísticas en la web, visita: hax.naghell.com\n\n`,
        player.id,
        0xb4b4b4, // Color gris claro
        "normal",
        2
      );
    }
  }

  async checkExistingPlayerAndNotify(player) {
    const existingPlayer = await this.checkExistingPlayer(player.name);
    if (existingPlayer) {
      const playerObj = this.getPlayer(player.name);
      playerObj.update({
        ...existingPlayer,
        isRegistered: true,
      });
      this.room.sendAnnouncement(
        `¡Bienvenido de vuelta, ${player.name}! Usa !login para acceder a tu cuenta.`,
        player.id,
        0xb4b4b4
      );
    } else {
      this.room.sendAnnouncement(
        `Usa !register para crear una cuenta y no perder tus stats.`,
        player.id,
        0xb4b4b4,
        "bold",
        2
      );
    }
  }

  async announcePlayerJoin(playerName) {
    const playerObj = this.getPlayer(playerName);
    if (playerObj && playerObj.isRegistered) {
      const { rankString, color, style, vipPrefix } =
        await getPlayerDisplayInfo(playerObj);
      this.room.sendAnnouncement(
        `[Server] ${vipPrefix}[${rankString}] ${playerName} ha entrado a la sala.`,
        null,
        color,
        style,
        1
      );
    } else {
      this.room.sendAnnouncement(
        `${playerName} ha entrado a la sala.`,
        null,
        0xb4b4b4,
        "normal",
        1
      );
    }
  }

  async handlePlayerLeave(player) {
    const playerObj = this.getPlayer(player.name);
    if (playerObj && playerObj.isRegistered) {
      const { rankString, color, style, vipPrefix } =
        await getPlayerDisplayInfo(playerObj);
      this.room.sendAnnouncement(
        `[Server] ${vipPrefix}[${rankString}] ${player.name} ha salido de la sala.`,
        null,
        color,
        style,
        1
      );
    } else {
      this.room.sendAnnouncement(
        `[Server] ${player.name} ha salido de la sala.`,
        null,
        0xb4b4b4,
        "normal",
        1
      );
    }
    this.players.delete(player.name);
  }

  async handleChat(player, message) {
    const playerObj = this.players.get(player.name);

    if (!playerObj || !playerObj.isLogged) {
      if (message.startsWith("!register ") || message.startsWith("!login ")) {
        return this.handleAuthCommand(playerObj, message);
      }
      this.room.sendAnnouncement(
        "[Server] Necesitas registrarte (!register) o iniciar sesión (!login) para chatear.",
        player.id,
        0xb4b4b4
      );
      return false;
    }
    switch (message) {
      case "!elo":
        this.handleEloCommand(player.id, playerObj);
        return false;
      default:
    }

    const { rankString, color, style, vipPrefix } = await getPlayerDisplayInfo(
      playerObj
    );
    this.room.sendAnnouncement(
      `${vipPrefix}[${rankString}] ${playerObj.name}: ${message}`,
      null,
      color,
      style,
      0
    );

    return false;
  }

  async handleEloCommand(id, player) {
    const elo = getEloRankInfo(player.elo);
    if (player.elo === -1) {
      this.room.sendAnnouncement(
        `[Server] Tu elo es de ${player.elo}. Aún te faltan ${
          10 - player.games_played
        } partidas de posicionamiento.`,
        id,
        elo.color
      );
    } else {
      this.room.sendAnnouncement(
        `[Server] Tu elo es de ${player.elo}. Estás en el rango de ${elo.name}.`,
        id,
        elo.color
      );
    }
  }

  async handleAuthCommand(player, message) {
    const [command, ...args] = message.split(" ");
    const playerName = player.name;
    const password = args[0];
    const confirmPassword = args[1];

    try {
      if (command === "!register") {
        if (args.length !== 2) {
          this.room.sendAnnouncement(
            "[Server] Usa: !register <contraseña> <contraseña>",
            player.id,
            0xb4b4b4
          );
          return false;
        }
        if (password !== confirmPassword) {
          this.room.sendAnnouncement(
            "[Server] Las contraseñas no son iguales.",
            player.id,
            0xb4b4b4
          );
          return false;
        }
        await this.registerPlayer(player, password);
        this.room.sendAnnouncement(
          `[Server] ${playerName} se registró correctamente.`,
          player.id,
          0xb4b4b4
        );
      } else if (command === "!login") {
        if (args.length !== 1) {
          this.room.sendAnnouncement(
            "[Server] Usa: !login <contraseña>",
            player.id,
            0xb4b4b4
          );
          return false;
        }
        await this.loginPlayer(playerName, password);
        this.room.sendAnnouncement(
          `[Server] ${playerName} inició sesión correctamente.`,
          player.id,
          0xb4b4b4
        );
      }
    } catch (error) {
      this.room.sendAnnouncement(
        `Error: ${error.message}`,
        player.id,
        0xb4b4b4
      );
    }

    return false;
  }

  async handleTeamVictory(scores) {
    const players = this.room.getPlayerList();
    for (const player of players) {
      const playerObj = this.getPlayer(player.name);
      if (playerObj && playerObj.isLogged) {
        const opponent = players.find((p) => p.team !== player.team);
        const opponentObj = this.getPlayer(opponent.name);
        if (opponentObj && opponentObj.isLogged) {
          const playerScore = player.team === scores.winning ? 1 : 0;
          const newElo = await calculateNewElo(
            playerObj,
            opponentObj,
            playerScore
          );
          await updatePlayerElo(playerObj, newElo, this.room);
        }
      }
    }
  }

  async checkExistingPlayer(playerName) {
    const { data, error } = await supabase
      .from("players")
      .select()
      .eq("name", playerName)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking existing player:", error);
    }

    return data;
  }

  async registerPlayer(player, password) {
    const existingPlayer = await this.checkExistingPlayer(player.name);

    if (existingPlayer) {
      throw new Error("El usuario ya existe");
    }

    const newPlayer = await supabase
      .from("players")
      .insert({
        name: player.name,
        password: password,
        auth: player.auth,
        created_at: new Date(),
        updated_at: new Date(),
        muted: false,
        banned: false,
      })
      .select();

    if (newPlayer.error) throw newPlayer.error;

    const newServerData = await supabase
      .from("player_server_data")
      .insert({
        player_id: newPlayer.data[0].id,
        server_id: this.serverId,
        elo: -1,
        games_played: 0,
        created_at: new Date(),
        updated_at: new Date(),
        wins: 0,
        losses: 0,
        promotion: false,
        promotion_wins: 0,
      })
      .single();

    if (newServerData.error) throw newServerData.error;

    const playerObj = this.players.get(player.name);
    playerObj.update({
      ...newPlayer.data,
      ...newServerData.data,
      isRegistered: true,
      isLogged: true,
    });
    balanceTeams();
  }

  async loginPlayer(playerName, password) {
    await this.announcePlayerJoin(playerName);
    const playerObj = this.players.get(playerName);
    if (!playerObj) {
      throw new Error("Jugador no encontrado");
    }

    const { data, error } = await supabase
      .from("players")
      .select()
      .eq("name", playerName)
      .eq("password", password)
      .single();

    if (error || !data) {
      throw new Error("Usuario o contraseña incorrectos");
    }

    playerObj.update({
      isLogged: true,
    });
    balanceTeams();
    return playerObj;
  }

  getPlayer(name) {
    return this.players.get(name);
  }

  async fetchPlayerData(playerName) {
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select()
      .eq("name", playerName)
      .single();

    if (playerError && playerError.code !== "PGRST116") {
      console.error("Error fetching player data:", playerError);
      return null;
    }

    if (playerData) {
      const { data: serverData, error: serverError } = await supabase
        .from("player_server_data")
        .select()
        .eq("player_id", playerData.id)
        .eq("server_id", this.serverId)
        .single();

      if (serverError && serverError.code !== "PGRST116") {
        console.error("Error fetching server data:", serverError);
        return null;
      }

      return { ...playerData, ...serverData, isRegistered: true };
    }

    return null;
  }
}

module.exports = PlayerManager;
