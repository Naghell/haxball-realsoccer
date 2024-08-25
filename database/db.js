const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is missing in environment variables.");
  process.exit(1);
}

console.log("Initializing Supabase client with URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Supabase client initialized");

module.exports = supabase;
