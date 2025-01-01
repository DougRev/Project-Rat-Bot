const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'logchat',
    description: 'Log a chat and save it in the admin log channel.',
    async execute(message, args) {
        if (!args.length) {
            return message.reply('Please provide a short description or context for the chat log.');
        }

        const description = args.join(' ');

        // Request the user to paste the chat log
        message.reply('Please paste the chat log (line-by-line). Send `!endlog` when you are finished.');

        const filter = (msg) => msg.author.id === message.author.id && msg.content !== '!endlog';
        const collector = message.channel.createMessageCollector({ filter, time: 60000 });

        let chatLog = [];
        collector.on('collect', (msg) => {
            chatLog.push(msg.content);
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                return message.reply('Chat log session timed out. Please try again.');
            }

            if (!chatLog.length) {
                return message.reply('No chat log received. Please try again.');
            }

            const logMessage = `**User:** ${message.author.tag}\n` +
                `**Date:** ${new Date().toISOString()}\n` +
                `**Description:** ${description}\n` +
                `**Log:**\n${chatLog.map(line => `- ${line}`).join('\n')}`;

            // Fetch the log channel
            const logChannelId = process.env.DISCORD_LOG_CHANNEL_ID;

            try {
                console.log('Attempting to fetch channel with ID:', logChannelId);
                const logChannel = await message.client.channels.fetch(logChannelId);
                console.log('Fetched Channel:', logChannel ? logChannel.name : 'null');

                if (!logChannel) {
                    return message.reply('Failed to log chat. Log channel does not exist or could not be fetched.');
                }

                const botPermissions = logChannel.permissionsFor(message.guild.members.me);
                if (!botPermissions || !botPermissions.has(PermissionsBitField.Flags.SendMessages)) {
                    return message.reply('Failed to log chat. Bot lacks the "Send Messages" permission in the log channel.');
                }

                await logChannel.send(logMessage);
                message.reply('✅ Chat log saved successfully.');
            } catch (err) {
                console.error('Error saving chat log:', err);
                message.reply('An error occurred while saving the chat log. Please try again later.');
            }
        });

        const endFilter = (msg) => msg.author.id === message.author.id && msg.content === '!endlog';
        const endCollector = message.channel.createMessageCollector({ filter: endFilter, max: 1, time: 60000 });
        endCollector.on('collect', () => {
            collector.stop('user_end');
        });
    },
};
