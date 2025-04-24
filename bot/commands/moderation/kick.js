const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'kick',
  category: 'moderation',
  description: 'Mengeluarkan user dari server',
  usage: '!kick @user',
  permissions: [PermissionFlagsBits.KickMembers],
  
  async execute(message, args) {
    const user = message.mentions.users.first();
    if (!user) return message.reply('Tag user yang ingin dikick!');

    try {
      await message.guild.members.kick(user);
      return message.reply(`Berhasil kick ${user.tag}`);
    } catch (err) {
      console.error(err);
      return message.reply('Gagal kick user');
    }
  }
};
