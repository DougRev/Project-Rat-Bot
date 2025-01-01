const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { fetchTwitchToken, fetchChannelId, isStreamLive, twitchConfig } = require('./commands/twitch');
const http = require('http');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Lightweight server for Heroku
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Project Rat Bot is running!');
});

// Listen on the Heroku-assigned port or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// Initialize DisTube with plugins and options
client.distube = new DisTube(client, {
    plugins: [new YtDlpPlugin()],
    emitNewSongOnly: true,
    customFilters: {}, // Optional, for custom audio filters
    nsfw: true, // Optional, allow NSFW audio
    emitAddSongWhenCreatingQueue: true, // Emit 'addSong' event
    emitAddListWhenCreatingQueue: true, // Emit 'addList' event
});

// Load event files dynamically
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Log a message when the bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Require your commands
const playCommand = require('./commands/play');
const stopCommand = require('./commands/stop');
const queueCommand = require('./commands/queue');
const skipCommand = require('./commands/skip');

const logChatCommand = require('./commands/logchat');
const getLogsCommand = require('./commands/getlogs');
const randomLogCommand = require('./commands/randomlog');
const listChannelsCommand = require('./commands/listchannels');

// Twitch Integration Setup
(async () => {
    await fetchTwitchToken();
    await fetchChannelId();
    console.log('Twitch integration is set up.');
})();

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('.')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Ignore `!endlog` from being treated as a command
    if (command === 'endlog') return;

    switch (command) {
        case 'play':
            playCommand.execute(message, args);
            break;
        case 'stop':
            stopCommand.execute(message);
            break;
        case 'queue':
            queueCommand.execute(message);
            break;
        case 'skip':
            skipCommand.execute(message);
            break;
        case 'streamstatus':
            const isLive = await isStreamLive();
            if (isLive) {
                message.channel.send(`${twitchConfig.username} is LIVE on Twitch! Watch here: https://twitch.tv/${twitchConfig.username}`);
            } else {
                message.channel.send(`${twitchConfig.username} is currently offline.`);
            }
            break;
        case 'logchat':
            logChatCommand.execute(message, args);
            break;
        case 'getlogs':
            getLogsCommand.execute(message, args);
            break;
        case 'randomlog':
            randomLogCommand.execute(message);
            break;
        case 'listchannels':
            listChannelsCommand.execute(message);
            break;
        default:
            message.reply(`Unknown command: \`${command}\``);
            break;
    }
});

// Periodic Twitch Stream Check
setInterval(async () => {
    const discordChannel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
    if (!discordChannel) {
        console.error('Discord channel not found. Check DISCORD_CHANNEL_ID in .env.');
        return;
    }

    const isLive = await isStreamLive();
    if (isLive) {
        discordChannel.send(`🎥 Hey everyone! ${twitchConfig.username} is now LIVE on Twitch! Check it out: https://twitch.tv/${twitchConfig.username}`);
    }
}, 5 * 60 * 1000); // Check every 5 minutes

// Log in the bot
client.login(process.env.DISCORD_TOKEN);
