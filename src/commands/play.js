// play.js

const SpotifyWebApi = require('spotify-web-api-node');
const youtube = require('youtube-sr').default; // Notice the .default

// Spotify API Setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Authenticate Spotify API (Initial Token Request)
(async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    console.log('Spotify API authenticated.');
  } catch (error) {
    console.error('Error authenticating Spotify API:', error);
  }
})();

// Refresh the token periodically to avoid expiration
const refreshSpotifyToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    console.log('Spotify token refreshed.');
  } catch (err) {
    console.error('Error refreshing Spotify token:', err);
  }
};
setInterval(refreshSpotifyToken, 1000 * 60 * 30);

const MAX_DISCORD_MESSAGE_LENGTH = 2000;
const MAX_SONGS = 50; // Limit to process up to 50 songs per playlist

// Helper function to split long messages
function splitMessage(message, maxLength = MAX_DISCORD_MESSAGE_LENGTH) {
  if (message.length <= maxLength) return [message];

  const lines = message.split('\n');
  const chunks = [];
  let currentChunk = '';

  for (const line of lines) {
    // +1 for the newline character
    if (currentChunk.length + line.length + 1 > maxLength) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }
  if (currentChunk) chunks.push(currentChunk);

  return chunks;
}

function sanitizeSpotifyString(str) {
  return str
    // remove (anything in parentheses)
    .replace(/\(.*?\)/g, '')
    // remove [anything in brackets]
    .replace(/\[.*?\]/g, '')
    // remove '- blah Remaster...' or 'Remastered'
    .replace(/-.*remaster.*/i, '')
    // replace slashes with spaces
    .replace(/\/+/g, ' ')
    // remove special punctuation that might confuse queries
    .replace(/[.,?~!@#$%^&*()+|]/g, '')
    .trim();
}

/**
 * Fetch all tracks from a Spotify playlist, handling pagination if necessary.
 * Returns an array of track objects (each having track.name, track.artists, etc.).
 */
async function fetchAllPlaylistTracks(playlistId) {
  let allTracks = [];
  let limit = 100;
  let offset = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await spotifyApi.getPlaylistTracks(playlistId, { limit, offset });
    allTracks = allTracks.concat(response.body.items);

    if (response.body.next) {
      offset += limit;
    } else {
      hasNext = false;
    }
  }
  return allTracks;
}

module.exports = {
  name: 'play',
  description: 'Play a song from YouTube (via search) or a Spotify playlist',
  async execute(message, args) {
    if (!args[0]) {
      return message.reply('Please provide a link, song name, or Spotify playlist!');
    }

    // Check if user is in voice channel
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('You need to be in a voice channel to play music!');
    }

    const query = args.join(' ');

    // If it's a Spotify playlist link
    if (query.includes('open.spotify.com/playlist')) {
      try {
        // Extract the playlist ID from the URL
        const playlistId = query.split('/playlist/')[1]?.split('?')[0];
        if (!playlistId) {
          return message.reply('Invalid Spotify playlist URL.');
        }

        // Get the playlist name (and other metadata)
        const playlistResponse = await spotifyApi.getPlaylist(playlistId);
        const playlistName = playlistResponse.body.name || 'Unknown Playlist';

        // Fetch all tracks from the playlist (handles paging for large playlists)
        const allTracks = await fetchAllPlaylistTracks(playlistId);
        // Limit to the first N songs
        const tracks = allTracks.slice(0, MAX_SONGS);

        if (tracks.length === 0) {
          return message.reply(`The Spotify playlist **${playlistName}** is empty or unavailable.`);
        }

        let successfulSongs = 0;
        let failedSongs = [];

        for (const item of tracks) {
          if (
            !item.track ||
            item.track.is_local ||
            !item.track.name ||
            !item.track.artists?.length
          ) {
            // Skip local/unavailable tracks
            continue;
          }

          // Clean up the track & artist name
          const trackName = sanitizeSpotifyString(item.track.name);
          const artistName = sanitizeSpotifyString(item.track.artists[0].name);

          if (!trackName) {
            // If after sanitizing the title is empty, skip it
            continue;
          }

          // 1) Attempt "Track + Artist" search
          let queryString = `${trackName} ${artistName}`.trim();

          // We'll do a custom YouTube search using youtube-sr
          let video = null;
          try {
            video = await youtube.searchOne(queryString, 'video');
            // fallback to just track name if not found
            if (!video || !video.url) {
              console.log(`No result for "${queryString}". Trying track name only...`);
              video = await youtube.searchOne(trackName, 'video');
            }
          } catch (searchErr) {
            console.error(`Search error for "${queryString}":`, searchErr);
            // if we can't even search, skip
            continue;
          }

          if (!video || !video.url) {
            console.error(`Still no result for "${trackName}".`);
            failedSongs.push(queryString);
            continue;
          }

          // 2) Distube plays the actual URL
          try {
            await message.client.distube.play(voiceChannel, video.url, {
              textChannel: message.channel,
              member: message.member,
            });
            successfulSongs++;
          } catch (distubeErr) {
            console.error(`Distube error for "${video.url}":`, distubeErr);
            failedSongs.push(queryString);
          }
        }

        // Construct response
        let responseMessage = `🎵 **${playlistName}** is queued!\nSongs added successfully: ${successfulSongs}`;

        // Report any failures
        if (failedSongs.length > 0) {
          responseMessage += `\nFailed to add ${failedSongs.length} song(s). Examples:\n` +
            failedSongs.slice(0, 5).map(song => `- ${song}`).join('\n');
          if (failedSongs.length > 5) {
            responseMessage += `\n...and ${failedSongs.length - 5} more.`;
          }
        }

        // If we truncated the list, mention it
        if (allTracks.length > MAX_SONGS) {
          responseMessage += `\n(Note: Only the first ${MAX_SONGS} songs were processed.)`;
        }

        // Split the message if too long
        const messages = splitMessage(responseMessage, MAX_DISCORD_MESSAGE_LENGTH);
        for (const msg of messages) {
          await message.channel.send(msg);
        }

      } catch (error) {
        console.error('Error processing Spotify playlist:', error);
        message.reply('An error occurred while processing the playlist. Please try again.');
      }
    }
    // Otherwise, treat it like a normal YouTube/keyword search
    else {
      try {
        // 1) Attempt to find a single video
        let video = await youtube.searchOne(query, 'video');
        if (!video || !video.url) {
          return message.reply(`No results found for "${query}".`);
        }

        // 2) Distube plays the actual URL
        await message.client.distube.play(voiceChannel, video.url, {
          textChannel: message.channel,
          member: message.member,
        });
        message.reply(`🎶 Now playing: **${video.title}**`);
      } catch (error) {
        console.error('Playback error:', error);
        message.reply('An error occurred while trying to play the music.');
      }
    }
  },
};
