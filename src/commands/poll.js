const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { readJSON, writeJSON } = require("../utils/jsonManager");
const { isOwner } = require("../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("poll")
        .setDescription("Poll system")
        .addSubcommand(sub =>
            sub.setName("bias").setDescription("Market bias poll")
        )
        .addSubcommand(sub =>
            sub.setName("create").setDescription("Create custom poll")
            .addStringOption(opt => opt.setName("question").setDescription("Poll question").setRequired(true))
            .addStringOption(opt => opt.setName("option1").setDescription("Option 1").setRequired(true))
            .addStringOption(opt => opt.setName("option2").setDescription("Option 2").setRequired(true))
            .addStringOption(opt => opt.setName("option3").setDescription("Option 3"))
            .addStringOption(opt => opt.setName("option4").setDescription("Option 4"))
            .addStringOption(opt => opt.setName("option5").setDescription("Option 5"))
        )
        .addSubcommand(sub =>
            sub.setName("delete").setDescription("Delete a poll")
            .addStringOption(opt => opt.setName("id").setDescription("Poll ID").setRequired(true))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const polls = await readJSON("polls.json");

        if (sub === "bias") {
            if (!(await isOwner(interaction))) {
                return interaction.reply({ content: "❌ Server owner only.", ephemeral: true });
            }

            const pollId = `bias_${Date.now()}`;
            const options = [
                { label: "Bullish", emoji: "🟢", voters: [] },
                { label: "Bearish", emoji: "🔴", voters: [] },
                { label: "Neutral", emoji: "⚪", voters: [] }
            ];

            polls[pollId] = { question: "Market Bias", options, guildId: interaction.guildId };
            await writeJSON("polls.json", polls);

            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setTitle("📊 Market Bias")
                .setDescription(options.map((opt, i) => `${opt.emoji} ${opt.label}: **0** votes`).join("
"))
                .setFooter({ text: "Click a button to vote" });

            const rows = options.map((opt, i) => 
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`poll_${pollId}_${i}`)
                        .setLabel(opt.label)
                        .setEmoji(opt.emoji)
                        .setStyle(ButtonStyle.Primary)
                )
            );

            await interaction.reply({ embeds: [embed], components: rows });
        }

        if (sub === "create") {
            if (!(await isOwner(interaction))) {
                return interaction.reply({ content: "❌ Server owner only.", ephemeral: true });
            }

            const question = interaction.options.getString("question");
            const options = [];
            const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

            for (let i = 1; i <= 5; i++) {
                const opt = interaction.options.getString(`option${i}`);
                if (opt) options.push({ label: opt, emoji: emojis[i-1], voters: [] });
            }

            const pollId = `poll_${Date.now()}`;
            polls[pollId] = { question, options, guildId: interaction.guildId };
            await writeJSON("polls.json", polls);

            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setTitle(question)
                .setDescription(options.map((opt, i) => `${opt.emoji} ${opt.label}: **0** votes`).join("
"))
                .setFooter({ text: "Click a button to vote" });

            const rows = [];
            let currentRow = new ActionRowBuilder();

            options.forEach((opt, i) => {
                if (i > 0 && i % 5 === 0) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }
                currentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`poll_${pollId}_${i}`)
                        .setLabel(opt.label)
                        .setEmoji(opt.emoji)
                        .setStyle(ButtonStyle.Primary)
                );
            });
            rows.push(currentRow);

            await interaction.reply({ embeds: [embed], components: rows });
        }

        if (sub === "delete") {
            if (!(await isOwner(interaction))) {
                return interaction.reply({ content: "❌ Server owner only.", ephemeral: true });
            }

            const pollId = interaction.options.getString("id");
            if (polls[pollId]) {
                delete polls[pollId];
                await writeJSON("polls.json", polls);
                await interaction.reply({ content: `✅ Poll deleted.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ Poll not found.`, ephemeral: true });
            }
        }
    }
};
