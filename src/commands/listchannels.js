const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'listchannels',
    description: 'List all available channels in the server and let the user select one.',
    async execute(message) {
        try {
            // Fetch text-based channels
            const channels = message.guild.channels.cache
                .filter(channel => channel.isTextBased())
                .map(channel => ({ id: channel.id, name: channel.name }));

            if (channels.length === 0) {
                return message.reply('No text channels found in this server.');
            }

            // Create a numbered list of channel names
            const channelList = channels
                .map((c, index) => `**${index + 1}**. ${c.name} (ID: ${c.id})`)
                .join('\n');

            // Send the list to the user
            message.reply(`📜 **Available Channels:**\n${channelList}\n\nPlease reply with the number of the channel you want to select.`);

            // Set up a message collector for the user to select a channel
            const filter = m => m.author.id === message.author.id && !isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) <= channels.length;
            const collector = message.channel.createMessageCollector({ filter, time: 60000 }); // Timeout set to 60 seconds

            collector.on('collect', async m => {
                const selectedIndex = parseInt(m.content) - 1; // Subtract 1 for zero-based index
                const selectedChannel = channels[selectedIndex];

                if (!selectedChannel) {
                    return message.reply('Invalid selection. Please try again.');
                }

                // Save the selected channel ID to an environment variable or config
                process.env.DISCORD_LOG_CHANNEL_ID = selectedChannel.id;

                message.reply(`✅ Selected channel: **${selectedChannel.name}** (ID: ${selectedChannel.id})`);
                collector.stop();
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    message.reply('⏰ Time ran out. Please try again.');
                }
            });
        } catch (error) {
            console.error('Error listing channels:', error);
            message.reply('An error occurred while listing channels. Please try again later.');
        }
    },
};
