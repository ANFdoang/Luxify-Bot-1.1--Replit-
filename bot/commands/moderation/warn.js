const { PermissionFlagsBits } = require('discord.js');
const Database = require('@replit/database');
const db = new Database();

// Database untuk warning
let warns = {};

// Load data warning
function loadWarns() {
  db.get('warns').then(data => {
    if (data) warns = data;
  });
}

// Save data warning
function saveWarns() {
  db.set('warns', warns);
}

// Load warns when module is required
loadWarns();

module.exports = {
  name: 'warn',
  category: 'moderation',
  description: 'Memberikan warning ke user',
  usage: '!warn @user',
  permissions: [PermissionFlagsBits.KickMembers],

  async execute(message, args) {
    const user = message.mentions.users.first();
    if (!user) return message.reply('Tag user yang ingin diwarn!');

    if (!warns[user.id]) warns[user.id] = 0;
    warns[user.id]++;
    saveWarns();

    message.reply(`${user.tag} telah diwarn (Total: ${warns[user.id]}/4)`);

    if (warns[user.id] >= 4) {
      try {
        await message.guild.members.ban(user, { reason: 'Menerima 4 warning' });
        message.channel.send(`${user.tag} telah diban karena menerima 4 warning`);
        delete warns[user.id];
        saveWarns();
      } catch (err) {
        console.error(err);
      }
    }
  }
};
