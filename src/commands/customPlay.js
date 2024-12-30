// customPlay.js

// Notice the '.default'
const youtube = require('youtube-sr').default;

module.exports = {
  name: 'customplay',
  async execute(message, args) {
    const query = args.join(' ');
    if (!query) return message.reply('Provide a search term!');

    // Make sure you have a voice channel
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('You must be in a voice channel!');
    }

    try {
      // 'video' = only videos (skip playlists, channels, etc.)
      const video = await youtube.searchOne(query, 'video');
      if (!video || !video.url) {
        return message.reply(`No results found for "${query}".`);
      }

      // Play via Distube
      await message.client.distube.play(voiceChannel, video.url, {
        textChannel: message.channel,
        member: message.member,
      });
      message.channel.send(`🎶 Now playing: **${video.title}**`);
    } catch (err) {
      console.error('Custom search error:', err);
      message.reply('An error occurred while searching YouTube.');
    }
  },
};
