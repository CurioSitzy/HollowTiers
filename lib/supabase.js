const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Gunakan service role key atau anon key

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ SUPABASE_URL atau SUPABASE_KEY belum terpasang di file .env!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
