require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, REST, Routes, Collection, MessageFlags } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Supabase Setup
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers
  ] 
});

client.commands = new Collection();
const commandsArray = [];

// ==========================================
// RECURSIVE COMMAND LOADER (Membaca Subfolder)
// ==========================================
const commandsPath = path.join(__dirname, 'commands');

function loadCommands(directory) {
  if (!fs.existsSync(directory)) return;

  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(directory, file.name);

    if (file.isDirectory()) {
      // Masuk ke dalam subfolder seperti 'Admin and Tester'
      loadCommands(fullPath);
    } else if (file.name.endsWith('.js')) {
      delete require.cache[require.resolve(fullPath)];
      const command = require(fullPath);

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());
        console.log(`🔹 Loaded Command: /${command.data.name}`);
      } else {
        console.log(`⚠️ Warning: Command at ${fullPath} is missing "data" or "execute" property.`);
      }
    }
  }
}

// Jalankan loader
loadCommands(commandsPath);

// ==========================================
// REGISTER ALL COMMANDS TO DISCORD API
// ==========================================
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`🔄 Deploying ${commandsArray.length} Slash Commands...`);
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandsArray }
    );
    
    console.log('✅ All Slash Commands successfully registered!');
  } catch (err) {
    console.error('❌ Failed to register Slash Commands:', err);
  }
}

// Ready Event
client.once('ready', async () => {
  console.log(`🤖 HollowTiers Main Bot is online as ${client.user.tag}`);
  await registerCommands();
});

// Interaction Handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, { supabase });
  } catch (error) {
    console.error(`❌ Error executing /${interaction.commandName}:`, error);
    const replyPayload = { content: '❌ Error executing command!', flags: MessageFlags.Ephemeral };
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(replyPayload).catch(() => null);
    } else {
      await interaction.reply(replyPayload).catch(() => null);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
