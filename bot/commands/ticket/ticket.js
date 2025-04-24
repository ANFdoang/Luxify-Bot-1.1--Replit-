const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits 
} = require('discord.js');

module.exports = {
  name: 'ticket',
  category: 'ticket',
  description: 'Mengirim embed ticket dengan button',
  usage: '!ticket',
  permissions: [PermissionFlagsBits.ManageChannels],

  async execute(message, args, client) {
    const CONFIG = {
      TICKET_CHANNEL: '1048619947514941482'
    };

    if (message.channel.id !== CONFIG.TICKET_CHANNEL) {
      return message.reply('Command ini hanya bisa digunakan di channel ticket!')
        .then(msg => setTimeout(() => msg.delete(), 5000));
    }

    // Hapus pesan command
    if (message.deletable) message.delete().catch(console.error);

    const embed = new EmbedBuilder()
      .setTitle('🛒 Butuh Bantuan?')
      .setDescription('Klik button di bawah untuk membuat ticket')
      .setColor('#2ecc71');

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('Buat Ticket')
          .setStyle(ButtonStyle.Primary)
      );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
};