const { Events } = require("discord.js");
const { readJSON, writeJSON } = require("../utils/jsonManager");
const { EmbedBuilder } = require("discord.js");

const xpCooldowns = new Map();

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const config = await readJSON("config.json");
        const xpPerMessage = config.xpPerMessage || 15;
        const cooldownSeconds = config.xpCooldown || 60;

        const userKey = `${message.guildId}_${message.author.id}`;
        const now = Date.now();

        if (xpCooldowns.has(userKey)) {
            const lastXP = xpCooldowns.get(userKey);
            if (now - lastXP < cooldownSeconds * 1000) return;
        }

        xpCooldowns.set(userKey, now);

        const xpData = await readJSON("xp.json");
        if (!xpData[message.guildId]) xpData[message.guildId] = {};
        if (!xpData[message.guildId][message.author.id]) {
            xpData[message.guildId][message.author.id] = { xp: 0, level: 1 };
        }

        const userData = xpData[message.guildId][message.author.id];
        userData.xp += xpPerMessage;

        const levelRate = config.levelRate || 1.5;
        const xpNeeded = Math.floor(100 * Math.pow(levelRate, userData.level - 1));

        if (userData.xp >= xpNeeded) {
            userData.level += 1;
            userData.xp = 0;

            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setDescription(`🎉 <@${message.author.id}> reached **Level ${userData.level}**`)
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
        }

        await writeJSON("xp.json", xpData);
    }
};
