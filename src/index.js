const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

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

// NEW: import the customPlay command
const customPlayCommand = require('./commands/customPlay');

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

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
        // NEW: your custom play command
        case 'customplay':
            customPlayCommand.execute(message, args);
            break;
        default:
            message.reply(`Unknown command: \`${command}\``);
            break;
    }
});

// Log in the bot
client.login(process.env.DISCORD_TOKEN);
