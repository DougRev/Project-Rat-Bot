module.exports = {
    name: 'guildMemberAdd',
    execute(member) {
        // Find the welcome channel
        const welcomeChannel = member.guild.channels.cache.find(ch => ch.name === 'welcome');
        if (!welcomeChannel) return;

        // Send a welcome message
        welcomeChannel.send(`Welcome to the server, ${member}! We're glad to have you here.`);

        // Assign a default role
        const role = member.guild.roles.cache.find(role => role.name === 'New Member');
        if (role) {
            member.roles.add(role).catch(console.error);
        }
    },
};
