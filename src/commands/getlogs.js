const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'getlogs',
    description: 'Retrieve all saved logs from the log channel.',
    async execute(message) {
        const logChannelId = process.env.DISCORD_LOG_CHANNEL_ID;

        try {
            const logChannel = await message.client.channels.fetch(logChannelId);

            // Debugging: Log the channel and permissions
            console.log('Fetched Log Channel:', logChannel ? logChannel.name : 'null');
            if (logChannel) {
                console.log('Permissions for Bot:', logChannel.permissionsFor(message.guild.members.me).toArray());
            }

            // Ensure the bot has permission to view the channel
            if (!logChannel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.ViewChannel)) {
                return message.reply('Failed to retrieve logs. Bot lacks the "View Channel" permission for the log channel.');
            }

            // Fetch the last 100 messages from the log channel
            const messages = await logChannel.messages.fetch({ limit: 100 });
            const logs = messages.map(msg => msg.content).reverse().join('\n\n');

            if (!logs) {
                return message.reply('No logs found in the log channel.');
            }

            // Send logs to the user
            message.author.send(`Here are the saved logs:\n\n${logs}`);
            message.reply('📜 Logs have been sent to your DMs.');
        } catch (err) {
            console.error('Error retrieving logs:', err);
            message.reply('An error occurred while retrieving the logs. Please try again later.');
        }
    },
};
