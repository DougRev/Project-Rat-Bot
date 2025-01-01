const axios = require('axios');
require('dotenv').config();

const twitchConfig = {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    username: process.env.TWITCH_USERNAME,
    accessToken: null,
    channelId: null,
};

async function fetchTwitchToken() {
    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: twitchConfig.clientId,
                client_secret: twitchConfig.clientSecret,
                grant_type: 'client_credentials',
            },
        });
        twitchConfig.accessToken = response.data.access_token;
        console.log('Twitch token fetched successfully.');
    } catch (error) {
        console.error('Error fetching Twitch token:', error);
    }
}

async function fetchChannelId() {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                Authorization: `Bearer ${twitchConfig.accessToken}`,
                'Client-ID': twitchConfig.clientId,
            },
            params: { login: twitchConfig.username },
        });
        twitchConfig.channelId = response.data.data[0].id;
        console.log(`Fetched Twitch channel ID: ${twitchConfig.channelId}`);
    } catch (error) {
        console.error('Error fetching Twitch channel ID:', error);
    }
}

async function isStreamLive() {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/streams', {
            headers: {
                Authorization: `Bearer ${twitchConfig.accessToken}`,
                'Client-ID': twitchConfig.clientId,
            },
            params: { user_id: twitchConfig.channelId },
        });
        return response.data.data.length > 0; // True if live
    } catch (error) {
        console.error('Error checking stream status:', error);
        return false;
    }
}

module.exports = {
    twitchConfig,
    fetchTwitchToken,
    fetchChannelId,
    isStreamLive,
};
