const request = require('request');
const { ActivityType } = require('discord.js');

function updatePlayerCount(client) {
    request.get({
        url: `https://servers-frontend.fivem.net/api/servers/single/${process.env.CFX_ID}`,
        json: true,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0' }
    }, (err, res, _data) => {
        if (err) {
            console.log('Error:', err);
            return;
        }

        const data = _data['Data'];

        if (res.statusCode !== 200 || data?.clients === undefined) {
            client.user.setPresence({
                status: process.env.ACTIVITY_STATUS,
                activities: [{
                    name: '💤 Offline',
                    type: ActivityType.Watching
                }]
            });
            return;
        }

        const spillere = data?.clients;
        const maxPlayers = data?.sv_maxclients;
        const internspillere = data?.name;

        client.user.setPresence({
            status: process.env.ACTIVITY_STATUS,
            activities: [{
                name: `📢 [${spillere}/${maxPlayers}] SPILLERE!`,
                type: ActivityType.Watching
            }]
        });
    });
}

module.exports = {
    updatePlayerCount
};
