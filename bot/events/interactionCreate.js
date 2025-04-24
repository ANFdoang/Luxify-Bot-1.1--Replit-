const { 
  ChannelType, 
  PermissionFlagsBits, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Only handle button interactions
    if (!interaction.isButton()) return;

    // Handle different button interactions
    switch (interaction.customId) {
      case 'create_ticket':
        await handleCreateTicket(interaction, client);
        break;
      case 'close_ticket':
        await handleCloseTicket(interaction);
        break;
      case 'giveaway_enter':
        await handleGiveawayEnter(interaction, client);
        break;
    }
  }
};

// Handle ticket creation
async function handleCreateTicket(interaction, client) {
  // Delete the original message with the ticket button
  try {
    await interaction.message.delete();
  } catch (error) {
    console.error('Error deleting ticket message:', error);
    // Continue with ticket creation even if deletion fails
  }

  // Check if user already has an open ticket
  const existingTicket = interaction.guild.channels.cache.find(
    channel => 
      channel.name.includes('ticket') && 
      channel.topic === interaction.user.id
  );

  if (existingTicket) {
    return interaction.reply({ 
      content: `Anda sudah memiliki ticket terbuka di ${existingTicket}`, 
      ephemeral: true 
    });
  }

  try {
    // Create new ticket channel
    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      topic: interaction.user.id,
      parent: '1049865886489641030', // Category ID
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        {
          id: '1048566231692754944', // Admin role ID
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        }
      ]
    });

    // Create close ticket button
    const closeButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Tutup Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

    // Send welcome message to the ticket channel
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('🎫 Ticket Baru')
      .setDescription(`Halo ${interaction.user}, silakan jelaskan kebutuhan Anda. Admin akan segera membantu.`)
      .setColor('#3498db')
      .setFooter({ text: 'Klik tombol Tutup Ticket jika sudah selesai' });

    await ticketChannel.send({ 
      content: `<@${interaction.user.id}> <@&1048566231692754944>`,
      embeds: [welcomeEmbed], 
      components: [closeButton] 
    });

    // Confirm to the user
    await interaction.reply({ 
      content: `Ticket Anda telah dibuat di ${ticketChannel}`, 
      ephemeral: true 
    });

    // Auto-close after 24 hours (86400000 ms)
    setTimeout(async () => {
      try {
        // Check if channel still exists
        const channel = await interaction.guild.channels.fetch(ticketChannel.id).catch(() => null);
        if (!channel) return;

        const closedEmbed = new EmbedBuilder()
          .setDescription('🛑 Ticket ini telah ditutup otomatis setelah 24 jam')
          .setColor('#ff0000');

        await channel.send({ embeds: [closedEmbed] });
        await channel.delete('Auto-close setelah 24 jam');
      } catch (error) {
        console.error('Gagal menutup ticket:', error);
      }
    }, 86400000); // 24 jam

  } catch (err) {
    console.error(err);
    await interaction.reply({ 
      content: 'Gagal membuat ticket, silakan coba lagi nanti.', 
      ephemeral: true 
    });
  }
}

// Handle ticket closing
async function handleCloseTicket(interaction) {
  if (!interaction.channel.name.includes('ticket')) return;

  // Reply with ephemeral message
  await interaction.reply({ 
    content: 'Ticket akan ditutup dalam 5 detik...', 
    ephemeral: true 
  });

  setTimeout(async () => {
    try {
      await interaction.channel.delete();
    } catch (err) {
      console.error(err);
      // Since the channel might be deleted, we can't edit the reply
      // If needed, we could send a DM to the user instead
      try {
        await interaction.user.send('Gagal menutup ticket, silakan coba lagi.');
      } catch (dmErr) {
        console.error('Failed to send DM:', dmErr);
      }
    }
  }, 5000);
}

// Handle giveaway entry
async function handleGiveawayEnter(interaction, client) {
  // Find the giveaway
  const giveaway = client.giveaways.find(g => 
    g.messageId === interaction.message.id
  );

  if (!giveaway) return;

  // Check if user already entered
  if (giveaway.participants.includes(interaction.user.id)) {
    return interaction.reply({ 
      content: 'Anda sudah berpartisipasi dalam giveaway ini!', 
      ephemeral: true 
    });
  }

  // Add user to participants
  giveaway.participants.push(interaction.user.id);

  // Confirm entry
  interaction.reply({ 
    content: 'Anda telah berpartisipasi dalam giveaway ini! 🎉', 
    ephemeral: true 
  });
}
