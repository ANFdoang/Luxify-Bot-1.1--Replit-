// command_handler.js
const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

/**
 * Loads all command files from the commands directory
 * @param {Client} client - The Discord.js client
 */
function loadCommands(client) {
  // Create a new commands collection on the client
  client.commands = new Collection();

  // Get all command category folders
  const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

  // Loop through each category folder
  for (const folder of commandFolders) {
    // Get all command files in the category
    const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', folder))
      .filter(file => file.endsWith('.js'));

    // Loop through each command file
    for (const file of commandFiles) {
      // Require the command file
      const command = require(path.join(__dirname, 'commands', folder, file));

      // Set the command in the collection
      if (command.name) {
        client.commands.set(command.name, command);
        console.log(`Loaded command: ${command.name} from ${folder}/${file}`);
      } else {
        console.log(`Failed to load command from ${folder}/${file}: missing name property`);
      }
    }
  }

  console.log(`Loaded ${client.commands.size} commands total`);
}

/**
 * Handles command execution from message events
 * @param {Message} message - The Discord.js message object
 * @param {Client} client - The Discord.js client
 * @param {string} prefix - The command prefix (e.g., '!')
 */
function handleCommand(message, client, prefix) {
  // Ignore messages that don't start with the prefix or are from bots
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // Parse the command and arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Find the command in the collection
  const command = client.commands.get(commandName);

  // If command doesn't exist, return
  if (!command) return;

  // Check if user has required permissions
  if (command.permissions && command.permissions.length) {
    const hasPermission = command.permissions.some(permission => 
      message.member.permissions.has(permission)
    );

    if (!hasPermission) {
      return message.reply('Anda tidak memiliki izin untuk menggunakan command ini!');
    }
  }

  // Execute the command
  try {
    // Pass client as third parameter for commands that need it
    command.execute(message, args, client.commands);
  } catch (error) {
    console.error(error);
    message.reply('Terjadi kesalahan saat menjalankan command!');
  }
}

module.exports = { loadCommands, handleCommand };
