module.exports = {
    name: 'queue',
    description: 'Display the current music queue',
    async execute(message) {
        const queue = message.client.distube.getQueue(message.guild.id);

        if (!queue) {
            return message.reply('The queue is currently empty!');
        }

        // Format and display the queue
        const songList = queue.songs
            .map((song, index) => `${index + 1}. ${song.name} (${song.formattedDuration})`)
            .join('\n');

        message.reply(`🎶 Current Queue:\n${songList}`);
    },
};

