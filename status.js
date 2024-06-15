const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { updatePlayerCount } = require('../utils/status');
const request = require('request');
const axios = require('axios');

var pingRange = [
    { emoji: "🟢", range: 50 },
    { emoji: "🟡", range: 100 },
    { emoji: "🟠", range: 150 },
    { emoji: "🔴", range: 200 }
];

async function LookupSteamProfile(steamID) {
    return new Promise((resolve, reject) => {
        var formData = new FormData();
        formData.append('url', steamID);

        axios.post('https://steamid.pro/', formData).then((response) => {
            let steamID64 = response.data.match(/value="lookup\/(.*?)"/)[1];
            let name = response.data.match(/"name": "(.*?)"/)[1];
            let image = response.data.match(/"image": "(.*?)"/)[1];

            var steamUser = {
                steamID: steamID,
                steamID64: steamID64,
                name: name,
                image: image
            }

            resolve(steamUser);
        }).catch((error) => {
            reject(null);
        });
    });
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('players')
        .setDescription('🌐 Displays information about active players'),
    async execute(interaction) {
        try {
            request.get({
                url: `https://servers-frontend.fivem.net/api/servers/single/${process.env.CFX_ID}`,
                json: true,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0' }
            }, async (err, res, _data) => {
                if (err) {
                    console.log('Error:', err);
                    return;
                }

                const data = _data['Data'];
                const players = data?.players || [];

                var internspillere = [];

                for (let i = 0; i < players.length; i++) {
                    const player = players[i];
                    const discordID = player.identifiers.find(id => id.startsWith('discord:'));
                    const steamID = player.identifiers.find(id => id.startsWith('steam:')) || null;
                    const ping = player.ping;
                    const pingEmoji = pingRange.find(r => ping <= r.range).emoji;

                    // if steamid is available, lookup steam profile
                    let steamUser = null;
                    if (steamID) {
                        await LookupSteamProfile(steamID).then((fetchedUser) => {
                            steamUser = fetchedUser;
                        }).catch((error) => {
                            console.log('Error:', error);
                        });
                    }

                    internspillere.push({
                        discordID: discordID,
                        steamID: steamID,
                        steamUser: steamUser,
                        ping: ping,
                        pingEmoji: pingEmoji
                    });
                }

                const spillere = data?.clients;
                const maxPlayers = data?.sv_maxclients;

                let description = ``;

                // total player count
                description += `Her kan du blandt andet finde information omkring hvem spiller på serveren og hvor mange der spiller på serveren!\n\n**ONLINE:**\n> *${spillere}/${maxPlayers}*\n`;

                // player list
                description += '\n**Spillere:**\n';
                for (let i = 0; i < internspillere.length; i++) {
                    const player = internspillere[i];
                    let steamUrl = "";
                    if (player.steamUser && player.steamUser.steamID64)
                        steamUrl = `[🔗 STEAM: - ${player.steamUser.name}](https://steamcommunity.com/profiles/${player.steamUser.steamID64})`;
                    else if (player.steamID)
                        steamUrl = `\`${player.steamID}\``;
                    else
                        steamUrl = 'N/A';

                    
                    description += `> <@${player.discordID.substr(8)}> | ${steamUrl} | ${player.pingEmoji} *${player.ping}ms*\n`;
                }

                const aboutEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('> Aktive Spillere')
                    .setDescription(description)
                    .setTimestamp()
                    .setFooter({ text: 'All rights to Stynex0 ' });

                const button = new ButtonBuilder()
                    .setLabel('Join Server')
                    .setURL(' ') // add your server connect link here
                    .setStyle('5')
                    .setEmoji('<:FiveM:1058467976363376760>');

                    // add new donate button
                 const donateButton = new ButtonBuilder()
                    .setLabel('Donate')
                    .setURL(' ') // add your donation link here
                    .setStyle('5')
                    .setEmoji('💰');

                const row = new ActionRowBuilder() 
                    .addComponents(button , donateButton);


                interaction.reply({
                    embeds: [aboutEmbed], 
                    components: [row],
                    ephemeral: false
                });
            });
        } catch (error) {
            console.error('Error executing /players command:', error);
            interaction.reply({ content: 'An error occurred while processing this Command - Try again later - The Developer has been informed' });
        }
    },
};
