const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'unmute',
  category: 'moderation',
  description: 'Menghapus role Muted dari user',
  usage: '!unmute @user [alasan]',
  permissions: [PermissionFlagsBits.ManageRoles],

  async execute(message, args) {
    // Check if a user is mentioned
    const user = message.mentions.users.first();
    if (!user) return message.reply('Tag user yang ingin diunmute!');

    // Get reason (optional)
    const reason = args.slice(1).join(' ') || 'Tidak ada alasan';

    try {
      // Get the member from the mentioned user
      const member = message.guild.members.cache.get(user.id);
      if (!member) return message.reply('User tidak ditemukan di server');

      // Find mute role
      const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');

      // Check if mute role exists
      if (!muteRole) {
        return message.reply('Role Muted tidak ditemukan di server');
      }

      // Check if user has mute role
      if (!member.roles.cache.has(muteRole.id)) {
        return message.reply('User ini tidak sedang dimute');
      }

      // Remove the mute role
      await member.roles.remove(muteRole, `Unmuted by ${message.author.tag} | Reason: ${reason}`);

      // Send confirmation message
      message.reply(`${user.tag} telah diunmute | Alasan: ${reason}`);

      // Notify the user
      try {
        await user.send(`Anda telah diunmute di server **${message.guild.name}** | Alasan: ${reason}`);
      } catch (err) {
        console.log(`Couldn't send DM to ${user.tag}`);
      }

    } catch (err) {
      console.error(err);
      message.reply('Gagal unmute user');
    }
  }
};
