const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
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
        )
        .addSubcommand(sub =>
            sub.setName("setxpneeded").setDescription("Set base XP needed to level up")
            .addIntegerOption(opt => opt.setName("amount").setDescription("Base XP amount").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("setlevelmsg").setDescription("Set level up congratulation message")
        ),

    async execute(interaction) {
        if (!(await isOwner(interaction))) {
            return interaction.reply({ content: "Server owner only.", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const config = await readJSON("config.json");

        if (sub === "set") {
            config.xpPerMessage = interaction.options.getInteger("amount");
            await writeJSON("config.json", config);
            const embed = new EmbedBuilder().setColor(0x2B2D42).setDescription("✅ XP per message set to **" + config.xpPerMessage + "**").setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "setlevelrate") {
            config.levelRate = interaction.options.getNumber("value");
            await writeJSON("config.json", config);
            const embed = new EmbedBuilder().setColor(0x2B2D42).setDescription("✅ Level rate set to **" + config.levelRate + "**").setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "setcooldown") {
            config.xpCooldown = interaction.options.getInteger("seconds");
            await writeJSON("config.json", config);
            const embed = new EmbedBuilder().setColor(0x2B2D42).setDescription("✅ XP cooldown set to **" + config.xpCooldown + "s**").setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "setxpneeded") {
            config.xpNeeded = interaction.options.getInteger("amount");
            await writeJSON("config.json", config);
            const embed = new EmbedBuilder().setColor(0x2B2D42).setDescription("✅ Base XP needed set to **" + config.xpNeeded + "**").setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "setlevelmsg") {
            const modal = new ModalBuilder().setCustomId("levelmsg_modal").setTitle("Level Up Message");
            const msgInput = new TextInputBuilder()
                .setCustomId("msg")
                .setLabel("Message (use {user} and {level})")
                .setStyle(TextInputStyle.Paragraph)
                .setValue(config.levelUpMsg || "🎉 {user} reached **Level {level}**!")
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(msgInput));
            await interaction.showModal(modal);

            const filter = i => i.customId === "levelmsg_modal" && i.user.id === interaction.user.id;
            try {
                const submitted = await interaction.awaitModalSubmit({ filter, time: 120000 });
                config.levelUpMsg = submitted.fields.getTextInputValue("msg");
                await writeJSON("config.json", config);
                const preview = config.levelUpMsg.replace("{user}", "<@" + interaction.user.id + ">").replace("{level}", "5");
                await submitted.reply({ content: "✅ Level up message updated!\nPreview: " + preview, ephemeral: true });
            } catch {
                // Timeout
            }
        }
    }
};
