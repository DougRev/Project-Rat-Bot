const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'randomlog',
    description: 'Fetch a random chat log from the log channel and post it to chat.',
    async execute(message) {
        try {
            const logChannelId = process.env.DISCORD_LOG_CHANNEL_ID;
            const logChannel = await message.client.channels.fetch(logChannelId);

            // Debugging: Log channel and permissions
            console.log('Fetched Log Channel:', logChannel ? logChannel.name : 'null');
            if (logChannel) {
                console.log('Permissions for Bot:', logChannel.permissionsFor(message.guild.members.me)?.toArray());
            }

            // Check if the bot has the necessary permissions
            const botPermissions = logChannel.permissionsFor(message.guild.members.me);
            if (!botPermissions || !botPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
                return message.reply('Failed to fetch logs. Bot lacks the "View Channel" permission for the log channel.');
            }

            if (!botPermissions.has(PermissionsBitField.Flags.ReadMessageHistory)) {
                return message.reply('Failed to fetch logs. Bot lacks the "Read Message History" permission for the log channel.');
            }

            // Fetch messages from the log channel
            const messages = await logChannel.messages.fetch({ limit: 100 });
            const logMessages = messages
                .filter(msg => msg.author.id === message.client.user.id) // Only logs posted by the bot
                .map(msg => msg.content);

            if (logMessages.length === 0) {
                return message.reply('No logs found in the log channel.');
            }

            // Select a random log
            const randomLog = logMessages[Math.floor(Math.random() * logMessages.length)];

            // Send the random log to the channel
            await message.channel.send(`📜 **Random Log:**\n${randomLog}`);
        } catch (err) {
            console.error('Error fetching random log:', err);
            message.reply('An error occurred while fetching a random log. Please try again later.');
        }
    },
};
