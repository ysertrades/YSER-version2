const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../utils/jsonManager");
const { buildEmbed, buildButtons, createPremiumEmbed } = require("../utils/embedBuilder");
const { isOwner } = require("../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Advanced embed system")
        .addSubcommand(sub => sub.setName("create").setDescription("Create a new embed via modal"))
        .addSubcommand(sub =>
            sub.setName("save").setDescription("Save the last created embed")
            .addStringOption(opt => opt.setName("name").setDescription("Embed name").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("load").setDescription("Load and send a saved embed")
            .addStringOption(opt => opt.setName("name").setDescription("Embed name").setRequired(true))
            .addChannelOption(opt => opt.setName("channel").setDescription("Target channel"))
        )
        .addSubcommand(sub =>
            sub.setName("delete").setDescription("Delete a saved embed")
            .addStringOption(opt => opt.setName("name").setDescription("Embed name").setRequired(true))
        )
        .addSubcommand(sub => sub.setName("list").setDescription("List all saved embeds"))
        .addSubcommand(sub =>
            sub.setName("edit").setDescription("Edit a saved embed")
            .addStringOption(opt => opt.setName("name").setDescription("Embed name").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("addbutton").setDescription("Add a link button to an embed")
            .addStringOption(opt => opt.setName("name").setDescription("Embed name").setRequired(true))
            .addStringOption(opt => opt.setName("label").setDescription("Button label").setRequired(true))
            .addStringOption(opt => opt.setName("url").setDescription("URL to open").setRequired(true))
            .addStringOption(opt => opt.setName("emoji").setDescription("Button emoji"))
        ),

    async execute(interaction) {
        if (!(await isOwner(interaction))) {
            return interaction.reply({ content: "Server owner only.", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const embeds = await readJSON("embeds.json");

        if (sub === "create") {
            const modal = new ModalBuilder().setCustomId("embed_modal").setTitle("Create Embed");
            const titleInput = new TextInputBuilder().setCustomId("title").setLabel("Title (optional)").setStyle(TextInputStyle.Short).setRequired(false);
            const descInput = new TextInputBuilder().setCustomId("description").setLabel("Description").setStyle(TextInputStyle.Paragraph).setRequired(true);
            const colorInput = new TextInputBuilder().setCustomId("color").setLabel("Color (hex, e.g. 2B2D42)").setStyle(TextInputStyle.Short).setRequired(false);
            const footerInput = new TextInputBuilder().setCustomId("footer").setLabel("Footer text (optional)").setStyle(TextInputStyle.Short).setRequired(false);
            const imageInput = new TextInputBuilder().setCustomId("image").setLabel("Image URL (bottom image, optional)").setStyle(TextInputStyle.Short).setRequired(false);
            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descInput),
                new ActionRowBuilder().addComponents(colorInput),
                new ActionRowBuilder().addComponents(footerInput),
                new ActionRowBuilder().addComponents(imageInput)
            );
            await interaction.showModal(modal);
        }

        if (sub === "save") {
            const name = interaction.options.getString("name");
            const tempData = interaction.client.tempEmbeds?.[interaction.user.id];
            if (!tempData) {
                return interaction.reply({ content: "No embed to save. Create one first with /embed create", ephemeral: true });
            }
            if (!embeds[interaction.guildId]) embeds[interaction.guildId] = {};
            embeds[interaction.guildId][name] = tempData;
            await writeJSON("embeds.json", embeds);
            const embed = createPremiumEmbed("Embed Saved", "Saved as **" + name + "**");
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "load") {
            const name = interaction.options.getString("name");
            const channel = interaction.options.getChannel("channel") || interaction.channel;
            const guildEmbeds = embeds[interaction.guildId] || {};
            const data = guildEmbeds[name];
            if (!data) {
                return interaction.reply({ content: "Embed **" + name + "** not found.", ephemeral: true });
            }
            try {
                const embed = buildEmbed(data);
                const buttons = buildButtons(data.buttons || []);
                await channel.send({ embeds: [embed], components: buttons });
                const reply = createPremiumEmbed("Embed Sent", "Sent **" + name + "** to " + channel.toString());
                await interaction.reply({ embeds: [reply], ephemeral: true });
            } catch (error) {
                console.error("Load embed error:", error);
                await interaction.reply({ content: "Error sending embed: " + error.message, ephemeral: true });
            }
        }

        if (sub === "delete") {
            const name = interaction.options.getString("name");
            if (embeds[interaction.guildId]?.[name]) {
                delete embeds[interaction.guildId][name];
                await writeJSON("embeds.json", embeds);
                const embed = createPremiumEmbed("Deleted", "Removed **" + name + "**");
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ content: "Embed **" + name + "** not found.", ephemeral: true });
            }
        }

        if (sub === "list") {
            const guildEmbeds = embeds[interaction.guildId] || {};
            const names = Object.keys(guildEmbeds);
            if (names.length === 0) {
                return interaction.reply({ content: "No saved embeds.", ephemeral: true });
            }
            const embed = createPremiumEmbed("Saved Embeds", names.map(n => "• " + n).join("\n"));
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "edit") {
            const name = interaction.options.getString("name");
            const guildEmbeds = embeds[interaction.guildId] || {};
            const data = guildEmbeds[name];
            if (!data) {
                return interaction.reply({ content: "Embed **" + name + "** not found.", ephemeral: true });
            }
            interaction.client.tempEmbeds = interaction.client.tempEmbeds || {};
            interaction.client.tempEmbeds[interaction.user.id] = data;
            const modal = new ModalBuilder().setCustomId("embed_modal").setTitle("Edit: " + name);
            const titleInput = new TextInputBuilder().setCustomId("title").setLabel("Title (optional)").setStyle(TextInputStyle.Short).setValue(data.title || "").setRequired(false);
            const descInput = new TextInputBuilder().setCustomId("description").setLabel("Description").setStyle(TextInputStyle.Paragraph).setValue(data.description || "").setRequired(true);
            const colorInput = new TextInputBuilder().setCustomId("color").setLabel("Color").setStyle(TextInputStyle.Short).setValue(data.color?.toString(16).toUpperCase() || "2B2D42").setRequired(false);
            const footerInput = new TextInputBuilder().setCustomId("footer").setLabel("Footer (optional)").setStyle(TextInputStyle.Short).setValue(data.footer || "").setRequired(false);
            const imageInput = new TextInputBuilder().setCustomId("image").setLabel("Image URL (optional)").setStyle(TextInputStyle.Short).setValue(data.image || "").setRequired(false);
            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descInput),
                new ActionRowBuilder().addComponents(colorInput),
                new ActionRowBuilder().addComponents(footerInput),
                new ActionRowBuilder().addComponents(imageInput)
            );
            await interaction.showModal(modal);
            const filter = i => i.customId === "embed_modal" && i.user.id === interaction.user.id;
            try {
                const submitted = await interaction.awaitModalSubmit({ filter, time: 300000 });
                const titleValue = submitted.fields.getTextInputValue("title");
                const newData = {
                    title: titleValue && titleValue.trim().length > 0 ? titleValue : undefined,
                    description: submitted.fields.getTextInputValue("description"),
                    color: parseInt((submitted.fields.getTextInputValue("color") || "2B2D42").replace("#", ""), 16),
                    footer: submitted.fields.getTextInputValue("footer") || undefined,
                    image: submitted.fields.getTextInputValue("image") || undefined,
                    timestamp: true,
                    buttons: data.buttons || []
                };
                embeds[interaction.guildId][name] = newData;
                await writeJSON("embeds.json", embeds);
                const { buildEmbed } = require("../utils/embedBuilder");
                const preview = buildEmbed(newData);
                await submitted.reply({ content: "Embed updated.", embeds: [preview], ephemeral: true });
            } catch {
                // Timeout
            }
        }

        if (sub === "addbutton") {
            const name = interaction.options.getString("name");
            const label = interaction.options.getString("label");
            const url = interaction.options.getString("url");
            const emoji = interaction.options.getString("emoji");
            const guildEmbeds = embeds[interaction.guildId] || {};
            const data = guildEmbeds[name];
            if (!data) {
                return interaction.reply({ content: "Embed **" + name + "** not found.", ephemeral: true });
            }
            if (!data.buttons) data.buttons = [];
            data.buttons.push({ label: label, url: url, style: "link", emoji: emoji || undefined });
            await writeJSON("embeds.json", embeds);
            const reply = createPremiumEmbed("Button Added", "Added link button **" + label + "** to **" + name + "**");
            await interaction.reply({ embeds: [reply], ephemeral: true });
        }
    }
};
