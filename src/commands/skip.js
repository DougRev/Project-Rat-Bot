module.exports = {
    name: 'skip',
    description: 'Skip the currently playing song',
    async execute(message) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply('You need to be in a voice channel to skip songs!');
        }

        try {
            const queue = message.client.distube.getQueue(message.guild.id);

            if (!queue) {
                return message.reply('There is no song to skip!');
            }

            message.client.distube.skip(message.guild.id);
            message.reply('⏩ Skipped to the next song!');
        } catch (error) {
            console.error('Skip Error:', error);
            message.reply('An error occurred while trying to skip the song.');
        }
    },
};
