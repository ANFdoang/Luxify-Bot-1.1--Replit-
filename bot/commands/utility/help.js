module.exports = {
  name: 'help',
  category: 'utility',
  description: 'Menampilkan list command',
  usage: '!help [command]',
  permissions: [],

  execute(message, args, commands) {
    // If no specific command is requested, show all commands
    if (!args.length) {
      // Group commands by category
      const categories = {};

      commands.forEach(cmd => {
        const category = cmd.category || 'Uncategorized';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(cmd);
      });

      // Create help message with categories
      let helpMessage = '**List Command:**\n\n';

      for (const [category, cmds] of Object.entries(categories)) {
        helpMessage += `**${category.charAt(0).toUpperCase() + category.slice(1)}**\n`;

        cmds.forEach(cmd => {
          helpMessage += `\`!${cmd.name}\` - ${cmd.description}\n`;
        });

        helpMessage += '\n';
      }

      helpMessage += 'Ketik `!help [command]` untuk informasi lebih detail tentang command tertentu.';

      return message.channel.send(helpMessage);
    }

    // If a specific command is requested
    const commandName = args[0].toLowerCase();
    const command = commands.get(commandName);

    if (!command) {
      return message.reply('Command tersebut tidak ditemukan!');
    }

    let helpMessage = `**Command: ${command.name}**\n`;
    helpMessage += `**Deskripsi:** ${command.description}\n`;
    helpMessage += `**Penggunaan:** ${command.usage || 'Tidak ada contoh penggunaan'}\n`;
    helpMessage += `**Kategori:** ${command.category || 'Uncategorized'}\n`;

    if (command.permissions && command.permissions.length) {
      helpMessage += '**Memerlukan Role:** ';
      command.permissions.forEach(perm => {
        helpMessage += `${perm.toString().replace('BigInt', '')} `;
      });
    }

    return message.channel.send(helpMessage);
  }
};
