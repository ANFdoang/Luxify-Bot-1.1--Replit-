// index.js
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const Database = require('@replit/database');
const db = new Database();
const express = require('express');
const app = express();
const port = 3000;
const { loadCommands, handleCommand } = require('./command_handler');

// Set up the Express web server for pinging
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(port, () => {
  console.log(`Web server running on port ${port}`);
});

// Set up periodic ping to keep the database connection active
async function pingDatabase() {
  try {
    const currentTime = Date.now();
    await db.set("lastPing", currentTime);
    console.log("Pinged database at: " + new Date(currentTime).toLocaleString());
  } catch (error) {
    console.error("Database ping error:", error);
  }

  // Schedule next ping in 5 minutes
  setTimeout(pingDatabase, 5 * 60 * 1000);
}

// Start the ping loop
pingDatabase();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildPresences
  ],
  // Add reconnect options
  restTimeOffset: 0,
  failIfNotExists: false,
  retryLimit: 10
});

// Initialize giveaways array
client.giveaways = [];

// Configuration
const CONFIG = {
  PREFIX: '!',
  REPUTATION_CHANNELS: ['1048620267934601306'],
  TICKET_CHANNEL: '1048619947514941482',
  ADMIN_ROLE: '1048566231692754944'
};

// Make CONFIG available globally
client.config = CONFIG;

// When bot is ready
client.on('ready', () => {
  console.log(`Bot online sebagai ${client.user.tag}`);
  client.user.setActivity('Luxify Store');

  // Load all commands
  loadCommands(client);

  // Check if ticket embed exists
  const ticketChannel = client.channels.cache.get(CONFIG.TICKET_CHANNEL);
  if (ticketChannel) {
    ticketChannel.messages.fetch().then(messages => {
      if (!messages.find(m => m.components && m.components.length > 0)) {
        // Use the ticket command to send the embed
        const ticketCommand = client.commands.get('ticket');
        if (ticketCommand) {
          const fakeMessage = { 
            channel: ticketChannel,
            deletable: false,
            reply: () => {}
          };
          ticketCommand.execute(fakeMessage, [], client);
        }
      }
    }).catch(error => {
      console.error("Error fetching messages:", error);
    });
  }
});

// Message event handler
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // Auto reaction di channel reputation
  if (CONFIG.REPUTATION_CHANNELS.includes(message.channel.id)) {
    message.react('✅').catch(console.error);
    return;
  }

  // Kontrol link
  if (!isAllowedToPostLinks(message)) {
    const linkRegex = /https?:\/\/[^\s]+/g;
    if (linkRegex.test(message.content) ) {
      message.delete().catch(console.error);
      message.author.send('Anda tidak diizinkan mengirim link di channel selain <#>!').catch(console.error);
    }
  }

  // Handle commands
  handleCommand(message, client, CONFIG.PREFIX);
});

// Use the interactionCreate event handler from events folder
client.on('interactionCreate', interaction => {
  try {
    require('./events/interactionCreate').execute(interaction, client);
  } catch (error) {
    console.error("Error handling interaction:", error);
    // Try to respond to the user if possible
    if (interaction.isRepliable() && !interaction.replied) {
      interaction.reply({ 
        content: 'Terjadi kesalahan saat memproses interaksi ini.', 
        ephemeral: true 
      }).catch(console.error);
    }
  }
});

// Helper function for link permissions
function isAllowedToPostLinks(message) {
  const allowedRoles = ['Admin', 'Moderator', 'Staff'];
  const allowedChannels = ['marketplace', 'jualan', 'toko'];

  const hasAllowedRole = message.member.roles.cache.some(role => 
    allowedRoles.includes(role.name)
  );

  const isAllowedChannel = allowedChannels.includes(message.channel.name);

  return hasAllowedRole || isAllowedChannel;
}

// Add reconnection event handlers
client.on('disconnect', (event) => {
  console.log('Bot disconnected from Discord. Attempting to reconnect...');
});

client.on('reconnecting', () => {
  console.log('Bot attempting to reconnect to Discord...');
});

client.on('resume', (replayed) => {
  console.log(`Bot reconnected to Discord. Replayed ${replayed} events.`);
});

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

client.on('shardError', error => {
  console.error('Shard error:', error);
});

// Set the maximum retry limit
//client.rest.setMaxRetries(10);

// Login to Discord with your bot token
function startBot() {
  client.login(process.env.TOKEN)
    .catch(error => {
      console.error("Login error:", error);

      // If rate limited, wait longer before retrying
      if (error.code === 429) {
        console.log("Rate limited. Waiting 60 seconds before reconnecting...");
        setTimeout(startBot, 60000);
      } else {
        // For other errors, retry after 5 seconds
        console.log("Retrying connection in 5 seconds...");
        setTimeout(startBot, 5000);
      }
    });
}

// Start the bot with error handling
startBot();
