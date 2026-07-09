const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON } = require("../utils/jsonManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View XP leaderboard")
        .addIntegerOption(opt => opt.setName("limit").setDescription("Top N users (default 10)")),

    async execute(interaction) {
        const limit = interaction.options.getInteger("limit") || 10;
        const xpData = await readJSON("xp.json");
        const guildData = xpData[interaction.guildId] || {};

        const sorted = Object.entries(guildData)
            .sort((a, b) => {
                if (b[1].level !== a[1].level) return b[1].level - a[1].level;
                return b[1].xp - a[1].xp;
            })
            .slice(0, limit);

        if (sorted.length === 0) {
            return interaction.reply({ content: "No XP data yet.", ephemeral: true });
        }

        const medals = ["🥇", "🥈", "🥉"];
        const description = sorted.map(([userId, data], i) => {
            const medal = medals[i] || `\`#${i + 1}\``;
            return `${medal} <@${userId}> — Level **${data.level}** (${data.xp} XP)`;
        }).join("
");

        const embed = new EmbedBuilder()
            .setColor(0x2B2D42)
            .setTitle("🏆 Leaderboard")
            .setDescription(description)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
