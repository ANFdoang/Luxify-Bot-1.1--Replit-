const { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ms = require('ms');

module.exports = {
  name: 'giveaway',
  category: 'utility',
  description: 'Membuat giveaway dengan durasi dan hadiah tertentu',
  usage: '!giveaway <durasi> <jumlah_pemenang> <hadiah>',
  permissions: [PermissionFlagsBits.ManageGuild],

  async execute(message, args, client) {
    // Check if ms package is installed
    try {
      if (!ms) {
        return message.reply('Package `ms` belum terinstall. Jalankan `npm install ms` terlebih dahulu.');
      }
    } catch (err) {
      return message.reply('Package `ms` belum terinstall. Jalankan `npm install ms` terlebih dahulu.');
    }

    // Check arguments
    if (args.length < 3) {
      return message.reply('Format: !giveaway <durasi> <jumlah_pemenang> <hadiah>\nContoh: !giveaway 1d 1 Nitro Classic');
    }

    // Parse duration
    const duration = ms(args[0]);
    if (!duration || isNaN(duration)) {
      return message.reply('Durasi tidak valid. Gunakan format seperti: 1m, 1h, 1d');
    }

    // Parse winner count
    const winnerCount = parseInt(args[1]);
    if (isNaN(winnerCount) || winnerCount < 1) {
      return message.reply('Jumlah pemenang harus berupa angka dan minimal 1');
    }

    // Get prize
    const prize = args.slice(2).join(' ');

    // Calculate end time
    const endTime = Date.now() + duration;

    // Create giveaway embed
    const giveawayEmbed = new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY 🎉')
      .setDescription(`**${prize}**\n\nKlik tombol di bawah untuk berpartisipasi!\nWaktu: <t:${Math.floor(endTime / 1000)}:R>\nDiadakan oleh: ${message.author}`)
      .setColor('#FF0000')
      .setFooter({ text: `${winnerCount} pemenang | Berakhir` })
      .setTimestamp(new Date(endTime));

    // Create button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_enter')
          .setLabel('Ikut Giveaway! 🎉')
          .setStyle(ButtonStyle.Primary)
      );

    // Send giveaway message
    const giveawayMessage = await message.channel.send({ embeds: [giveawayEmbed], components: [row] });

    // Store giveaway data
    const giveawayData = {
      messageId: giveawayMessage.id,
      channelId: giveawayMessage.channel.id,
      guildId: message.guild.id,
      prize: prize,
      winnerCount: winnerCount,
      endTime: endTime,
      hosterId: message.author.id,
      participants: []
    };

    // Save giveaway data (this would typically use a database)
    if (!client.giveaways) client.giveaways = [];
    client.giveaways.push(giveawayData);

    // Set timeout to end the giveaway
    setTimeout(() => endGiveaway(client, giveawayData), duration);

    // Delete command message
    if (message.deletable) await message.delete();
  }
};

// Function to end giveaway
async function endGiveaway(client, giveawayData) {
  try {
    // Get guild and channel
    const guild = client.guilds.cache.get(giveawayData.guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(giveawayData.channelId);
    if (!channel) return;

    // Fetch the giveaway message
    const giveawayMessage = await channel.messages.fetch(giveawayData.messageId).catch(() => null);
    if (!giveawayMessage) return;

    // Check if there are participants
    if (giveawayData.participants.length === 0) {
      const noWinnerEmbed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY BERAKHIR 🎉')
        .setDescription(`**${giveawayData.prize}**\n\nTidak ada pemenang karena tidak ada yang berpartisipasi.`)
        .setColor('#FF0000')
        .setFooter({ text: 'Giveaway Berakhir' })
        .setTimestamp();

      await giveawayMessage.edit({ embeds: [noWinnerEmbed], components: [] });
      return;
    }

    // Select winners
    const winnerCount = Math.min(giveawayData.winnerCount, giveawayData.participants.length);
    const winners = [];

    // Randomly select winners
    for (let i = 0; i < winnerCount; i++) {
      const winnerIndex = Math.floor(Math.random() * giveawayData.participants.length);
      winners.push(giveawayData.participants[winnerIndex]);
      giveawayData.participants.splice(winnerIndex, 1); // Remove winner to avoid duplicates
    }

    // Format winner mentions
    const winnerMentions = winners.map(id => `<@${id}>`).join(', ');

    // Create winner embed
    const winnerEmbed = new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY BERAKHIR 🎉')
      .setDescription(`**${giveawayData.prize}**\n\nPemenang: ${winnerMentions}`)
      .setColor('#00FF00')
      .setFooter({ text: 'Giveaway Berakhir' })
      .setTimestamp();

    // Update giveaway message
    await giveawayMessage.edit({ embeds: [winnerEmbed], components: [] });

    // Send winner announcement
    channel.send(`Selamat kepada ${winnerMentions}! Kalian memenangkan **${giveawayData.prize}**!`);

    // Remove giveaway from client.giveaways
    if (client.giveaways) {
      const index = client.giveaways.findIndex(g => g.messageId === giveawayData.messageId);
      if (index !== -1) client.giveaways.splice(index, 1);
    }
  } catch (error) {
    console.error('Error ending giveaway:', error);
  }
}
