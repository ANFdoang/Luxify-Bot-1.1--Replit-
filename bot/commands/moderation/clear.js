const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'clear',
  category: 'moderation',
  description: 'Menghapus sejumlah pesan dari channel',
  usage: '!clear [jumlah]',
  permissions: [PermissionFlagsBits.ManageMessages],

  async execute(message, args) {
    // Get the amount to delete, default to 1 if not specified
    const amount = parseInt(args[0]) || 1;

    // Check if amount is valid
    if (amount < 1 || amount > 100) {
      return message.reply('Masukkan jumlah antara 1-100');
    }

    try {
      // Delete messages (+1 to include the command message)
      await message.channel.bulkDelete(amount + 1);

      // Send confirmation message
      const confirmMsg = await message.channel.send(`Berhasil menghapus ${amount} pesan`);

      // Delete confirmation message after 3 seconds
      setTimeout(() => {
        confirmMsg.delete().catch(err => console.error('Failed to delete confirmation message:', err));
      }, 3000);
    } catch (err) {
      console.error(err);

      // Check if error is due to messages being too old
      if (err.code === 50034) {
        return message.reply('Tidak dapat menghapus pesan yang lebih lama dari 14 hari');
      }

      message.reply('Gagal menghapus pesan');
    }
  }
};
