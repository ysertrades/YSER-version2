const { Events } = require("discord.js");

module.exports = (client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error("Command error:", error);
                const reply = { content: "An error occurred.", ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
        }

        if (interaction.isButton()) {
            try {
                if (interaction.customId.startsWith("poll_")) {
                    const { readJSON, writeJSON } = require("../utils/jsonManager");
                    const polls = await readJSON("polls.json");
                    const parts = interaction.customId.split("_");
                    const pollId = parts[1] + "_" + parts[2];
                    const optionIndex = parseInt(parts[3]);
                    const poll = polls[pollId];
                    if (!poll) return;
                    poll.options.forEach(opt => {
                        opt.voters = opt.voters.filter(v => v !== interaction.user.id);
                    });
                    if (poll.options[optionIndex]) {
                        poll.options[optionIndex].voters.push(interaction.user.id);
                    }
                    await writeJSON("polls.json", polls);
                    const { EmbedBuilder } = require("discord.js");
                    const totalVotes = poll.options.reduce((a, b) => a + b.voters.length, 0);
                    const embed = new EmbedBuilder()
                        .setColor(0x2B2D42)
                        .setTitle(poll.question)
                        .setDescription(poll.options.map((opt, i) => opt.emoji + " " + opt.label + ": **" + opt.voters.length + "** votes").join("\n"))
                        .setFooter({ text: "YSER Flow — Total votes: " + totalVotes });
                    await interaction.update({ embeds: [embed] });
                }
            } catch (error) {
                console.error("Button error:", error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: "An error occurred.", ephemeral: true });
                }
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === "embed_modal") {
                try {
                    const title = interaction.fields.getTextInputValue("title");
                    const description = interaction.fields.getTextInputValue("description");
                    const color = interaction.fields.getTextInputValue("color") || "2B2D42";
                    const footer = interaction.fields.getTextInputValue("footer") || "";
                    const image = interaction.fields.getTextInputValue("image") || "";
                    const embedData = {
                        title: title && title.trim().length > 0 ? title : undefined,
                        description: description,
                        color: parseInt(color.replace("#", ""), 16),
                        footer: footer && footer.trim().length > 0 ? footer : undefined,
                        image: image && image.trim().length > 0 ? image : undefined,
                        timestamp: true
                    };
                    const { buildEmbed } = require("../utils/embedBuilder");
                    const embed = buildEmbed(embedData);
                    client.tempEmbeds = client.tempEmbeds || {};
                    client.tempEmbeds[interaction.user.id] = embedData;
                    await interaction.reply({
                        content: "Embed preview created. Use `/embed save name:<name>` to save it.",
                        embeds: [embed],
                        ephemeral: true
                    });
                } catch (error) {
                    console.error("Modal error:", error);
                    await interaction.reply({ content: "An error occurred processing the modal.", ephemeral: true });
                }
            }
        }
    });
};
