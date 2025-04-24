const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'mute',
  category: 'moderation',
  description: 'Membisukan user dengan memberikan role Muted',
  usage: '!mute @user [alasan]',
  permissions: [PermissionFlagsBits.ManageRoles],

  async execute(message, args) {
    // Check if a user is mentioned
    const user = message.mentions.users.first();
    if (!user) return message.reply('Tag user yang ingin dimute!');

    // Get reason (optional)
    const reason = args.slice(1).join(' ') || 'Tidak ada alasan';

    try {
      // Get the member from the mentioned user
      const member = message.guild.members.cache.get(user.id);
      if (!member) return message.reply('User tidak ditemukan di server');

      // Check if bot has permission to manage the user
      if (member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
        return message.reply('Saya tidak memiliki izin untuk mute user ini karena role mereka lebih tinggi dari saya');
      }

      // Check if the command user has permission to manage the target user
      if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
        return message.reply('Anda tidak dapat mute user dengan role yang sama atau lebih tinggi dari Anda');
      }

      // Find or create mute role
      let muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');

      if (!muteRole) {
        // Create the mute role if it doesn't exist
        muteRole = await message.guild.roles.create({
          name: 'Muted',
          color: '#000000',
          reason: 'Role untuk membisukan user',
          permissions: []
        });

        // Update permissions for all channels
        message.guild.channels.cache.forEach(async channel => {
          await channel.permissionOverwrites.create(muteRole, {
            SendMessages: false,
            AddReactions: false,
            Speak: false,
            Stream: false
          });
        });
      }

      // Add the mute role to the member
      await member.roles.add(muteRole, `Muted by ${message.author.tag} | Reason: ${reason}`);

      // Send confirmation message
      message.reply(`${user.tag} telah dimute | Alasan: ${reason}`);

      // Notify the user
      try {
        await user.send(`Anda telah dimute di server **${message.guild.name}** | Alasan: ${reason}`);
      } catch (err) {
        console.log(`Couldn't send DM to ${user.tag}`);
      }

    } catch (err) {
      console.error(err);
      message.reply('Gagal mute user');
    }
  }
};
