const fs = require('fs');
const path = require('path');
require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const axios = require('axios');
const qs = require('querystring');
const http = require('http');
const { execSync } = require('child_process');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Initialize Express app
const app = express();

// Define a route for the root path
app.get('/', (req, res) => {
    res.send('Welcome to Project Rat Bot!');
});

// Handle OAuth2 callback
app.get('/oauth/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('No code provided!');
    }

    try {
        const response = await axios.post(
            'https://discord.com/api/oauth2/token',
            qs.stringify({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: 'https://project-rat-bot-842d5dfdaeb6.herokuapp.com/oauth/callback',
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token, token_type, scope } = response.data;

        console.log('Access Token:', access_token);
        console.log('Token Type:', token_type);
        console.log('Scope:', scope);

        res.send('Bot successfully authorized!');
    } catch (error) {
        console.error('Error exchanging code for token:', error.message);
        res.status(500).send('Failed to authorize bot.');
    }
});

// Ensure the FFmpeg path is set
process.env.FFMPEG_PATH = execSync('which ffmpeg').toString().trim();
console.log('FFmpeg Path:', process.env.FFMPEG_PATH);

// Lightweight server for Heroku (integrated with Express)
const server = http.createServer(app);

// Listen on the Heroku-assigned port or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// Initialize DisTube with plugins and options
client.distube = new DisTube(client, {
    plugins: [new YtDlpPlugin()],
    emitNewSongOnly: true,
    customFilters: {}, 
    nsfw: true, 
    emitAddSongWhenCreatingQueue: true, 
    emitAddListWhenCreatingQueue: true, 
    ffmpegPath: process.env.FFMPEG_PATH, 
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

// Command handler
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
        case 'logchat':
            logChatCommand.execute(message, args);
            break;
        case 'getlogs':
            getLogsCommand.execute(message, args);
            break;
        case 'randomlog':
            randomLogCommand.execute(message);
            break;
        default:
            message.reply(`Unknown command: \`${command}\``);
            break;
    }
});

// Log in the bot
client.login(process.env.DISCORD_TOKEN);
