const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../utils/jsonManager");
const { isOwner } = require("../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("filter")
        .setDescription("Auto-moderation filters")
        .addSubcommand(sub =>
            sub.setName("add").setDescription("Add a bad word")
            .addStringOption(opt => opt.setName("word").setDescription("Word to filter").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("remove").setDescription("Remove a bad word")
            .addStringOption(opt => opt.setName("word").setDescription("Word to remove").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("list").setDescription("List filtered words")
        )
        .addSubcommand(sub =>
            sub.setName("antilink").setDescription("Toggle anti-link")
            .addStringOption(opt => opt.setName("state").setDescription("On or Off").setRequired(true)
                .addChoices({ name: "On", value: "on" }, { name: "Off", value: "off" }))
        ),

    async execute(interaction) {
        if (!(await isOwner(interaction))) {
            return interaction.reply({ content: "Server owner only.", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const filter = await readJSON("filter.json");
        if (!filter[interaction.guildId]) filter[interaction.guildId] = { words: [], antilink: false };

        if (sub === "add") {
            const word = interaction.options.getString("word").toLowerCase();
            if (!filter[interaction.guildId].words.includes(word)) {
                filter[interaction.guildId].words.push(word);
                await writeJSON("filter.json", filter);
            }
            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setDescription("✅ Added `" + word + "` to filter.")
                .setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "remove") {
            const word = interaction.options.getString("word").toLowerCase();
            filter[interaction.guildId].words = filter[interaction.guildId].words.filter(w => w !== word);
            await writeJSON("filter.json", filter);
            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setDescription("✅ Removed `" + word + "` from filter.")
                .setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "list") {
            const words = filter[interaction.guildId].words;
            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setTitle("🚫 Filtered Words")
                .setDescription(words.length > 0 ? words.map(w => "• `" + w + "`").join("\n") : "No words filtered.")
                .setFooter({ text: "YSER Flow — Anti-link: " + (filter[interaction.guildId].antilink ? "ON" : "OFF") });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "antilink") {
            const state = interaction.options.getString("state") === "on";
            filter[interaction.guildId].antilink = state;
            await writeJSON("filter.json", filter);
            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setDescription("🔗 Anti-link is now **" + (state ? "ON" : "OFF") + "**.")
                .setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
