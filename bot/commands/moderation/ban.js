const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'ban',
  category: 'moderation',
  description: 'Membanned user dari server',
  usage: '!ban @user',
  permissions: [PermissionFlagsBits.BanMembers],
  
  async execute(message, args) {
    const user = message.mentions.users.first();
    if (!user) return message.reply('Tag user yang ingin diban!');

    try {
      await message.guild.members.ban(user);
      return message.reply(`Berhasil ban ${user.tag}`);
    } catch (err) {
      console.error(err);
      return message.reply('Gagal ban user');
    }
  }
};
