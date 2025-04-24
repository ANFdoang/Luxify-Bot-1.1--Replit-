const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'unban',
  category: 'moderation',
  description: 'Membuka banned user dari server',
  usage: '!unban <userId/username> [alasan]',
  permissions: [PermissionFlagsBits.BanMembers],

  async execute(message, args) {
    // Check if a user ID or username is provided
    if (!args[0]) return message.reply('Masukkan ID atau username user yang ingin diunban!');

    // Get reason (optional)
    const reason = args.slice(1).join(' ') || 'Tidak ada alasan';

    try {
      // Fetch ban list
      const bans = await message.guild.bans.fetch();

      // Check if there are any bans
      if (bans.size === 0) {
        return message.reply('Tidak ada user yang dibanned di server ini');
      }

      // Find the banned user
      const userIdOrName = args[0];
      let bannedUser;

      // Check if input is a user ID
      if (/^\d+$/.test(userIdOrName)) {
        bannedUser = bans.find(ban => ban.user.id === userIdOrName);
      } else {
        // If not an ID, try to find by username
        bannedUser = bans.find(ban => 
          ban.user.username.toLowerCase() === userIdOrName.toLowerCase() ||
          ban.user.tag.toLowerCase() === userIdOrName.toLowerCase()
        );
      }

      // Check if user is found in ban list
      if (!bannedUser) {
        return message.reply('User tersebut tidak ditemukan dalam daftar banned');
      }

      // Unban the user
      await message.guild.members.unban(bannedUser.user.id, `Unbanned by ${message.author.tag} | Reason: ${reason}`);

      // Send confirmation message
      message.reply(`${bannedUser.user.tag} (${bannedUser.user.id}) telah diunban | Alasan: ${reason}`);

    } catch (err) {
      console.error(err);
      message.reply('Gagal unban user');
    }
  }
};
