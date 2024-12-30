module.exports = {
    name: 'stop',
    description: 'Stop the music and leave the voice channel',
    async execute(message) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply('You need to be in a voice channel to stop the music!');
        }

        try {
            const queue = message.client.distube.getQueue(message.guild.id);

            if (!queue) {
                return message.reply('There is no music playing to stop!');
            }

            message.client.distube.stop(message.guild.id);
            message.reply('Music stopped, and I have left the voice channel.');
        } catch (error) {
            console.error(error);
            message.reply('An error occurred while trying to stop the music.');
        }
    },
};
