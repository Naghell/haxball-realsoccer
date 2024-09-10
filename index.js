require("dotenv").config();
const abcHaxballAPI = require("node-haxball");
const PlayerManager = require("./players/playerManager");
const { loadRanks } = require("./systems/ranks");
const supabase = require("./database/db");
const { initializeTriggerActions } = require("./functions/triggerActions");
const stadiumConfig = require("./systems/stadium");

const SERVER_ID = process.env.SERVER_ID;

async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("rooms").select("id").limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Supabase connection failed:", error.message);
    return false;
  }
}

async function fetchRoomSettings() {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("server_id", SERVER_ID)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Failed to fetch room settings:", error.message);
    return null;
  }
}

async function initializeRoom() {
  const API = abcHaxballAPI();
  const { Room, Utils } = API;
  console.log("Starting room initialization...");

  const isConnected = await testSupabaseConnection();
  if (!isConnected) {
    console.error("Cannot initialize room due to Supabase connection failure.");
    return;
  }

  const roomSettings = await fetchRoomSettings();
  if (!roomSettings) {
    console.error(
      "Cannot initialize room due to failure in fetching room settings."
    );
    return;
  }

  await loadRanks(SERVER_ID);

  try {
    const roomConfig = {
      name: roomSettings.name || "Default Room Name",
      maxPlayerCount: roomSettings.max_players || 18,
      showInRoomList: roomSettings.public === true,
      isHost: true,
      token: process.env.HAXBALL_TOKEN,
      password: roomSettings.password || null,
    };

    const room = Room.create(roomConfig, {
      storage: {
        player_name: "hax.naghell.com",
        avatar: "👽",
        geo: {
          flag: "AR",
          lat: -34.5745,
          lon: -58.3805,
        },
      },
      onSuccess: (room) => {
        console.log(`Room "${room.name}" created successfully`);
        const parsedStadium = Utils.parseStadium(
          JSON.stringify(stadiumConfig),
          console.warn
        );

        room.setCurrentStadium(parsedStadium);
        const playerManager = new PlayerManager(room, SERVER_ID);

        initializeTriggerActions(room, playerManager);

        console.log("Room fully initialized");
      },
      onError: (error, playerId) => {
        console.error(`Error for player ${playerId}:`, error);
        // Handle the error as needed
      },
    });
  } catch (error) {
    console.error("Failed to initialize room:", error);
  }
}

initializeRoom();

// Error handling for unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
