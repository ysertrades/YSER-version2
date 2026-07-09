const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../utils/jsonManager");
const { isOwner } = require("../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xp")
        .setDescription("XP system configuration")
        .addSubcommand(sub =>
            sub.setName("set").setDescription("Set XP per message")
            .addIntegerOption(opt => opt.setName("amount").setDescription("XP amount").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("setlevelrate").setDescription("Set level scaling rate")
            .addNumberOption(opt => opt.setName("value").setDescription("Rate (default 1.5)").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("setcooldown").setDescription("Set XP cooldown in seconds")
            .addIntegerOption(opt => opt.setName("seconds").setDescription("Cooldown").setRequired(true))
        ),

    async execute(interaction) {
        if (!(await isOwner(interaction))) {
            return interaction.reply({ content: "❌ Server owner only.", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const config = await readJSON("config.json");

        if (sub === "set") {
            config.xpPerMessage = interaction.options.getInteger("amount");
            await writeJSON("config.json", config);
            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setDescription(`✅ XP per message set to **${config.xpPerMessage}**`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "setlevelrate") {
            config.levelRate = interaction.options.getNumber("value");
            await writeJSON("config.json", config);
            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setDescription(`✅ Level rate set to **${config.levelRate}**`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "setcooldown") {
            config.xpCooldown = interaction.options.getInteger("seconds");
            await writeJSON("config.json", config);
            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setDescription(`✅ XP cooldown set to **${config.xpCooldown}s**`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
