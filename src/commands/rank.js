const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON } = require("../utils/jsonManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription("View your rank and XP")
        .addUserOption(opt => opt.setName("user").setDescription("Target user")),

    async execute(interaction) {
        const target = interaction.options.getUser("user") || interaction.user;
        const xpData = await readJSON("xp.json");
        const guildData = xpData[interaction.guildId] || {};
        const userData = guildData[target.id] || { xp: 0, level: 1 };
        const config = await readJSON("config.json");
        const levelRate = config.levelRate || 1.5;
        const baseXp = config.xpNeeded || 100;

        // Calculate XP needed for CURRENT level
        const xpNeeded = Math.floor(baseXp * Math.pow(levelRate, userData.level - 0));
        const progress = userData.xp > 0 ? Math.floor((userData.xp / xpNeeded) * 100) : 0;
        const bar = "█".repeat(Math.floor(progress / 10)) + "░".repeat(10 - Math.floor(progress / 10));

        const embed = new EmbedBuilder()
            .setColor(0x2B2D42)
            .setTitle("📊 " + target.username)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: "Level", value: "**" + userData.level + "**", inline: true },
                { name: "XP", value: "**" + userData.xp + " / " + xpNeeded + "**", inline: true },
                { name: "Progress", value: "`[" + bar + "] " + progress + "%`", inline: false }
            )
            .setFooter({ text: "XP System" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
