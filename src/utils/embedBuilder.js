const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function buildEmbed(data) {
    const embed = new EmbedBuilder()
        .setColor(data.color || 0x2B2D42);

    if (data.title) embed.setTitle(data.title);
    if (data.description) embed.setDescription(data.description);
    if (data.footer) embed.setFooter({ text: data.footer });
    else embed.setFooter({ text: "YSER Flow" });
    if (data.timestamp) embed.setTimestamp();
    if (data.thumbnail) embed.setThumbnail(data.thumbnail);
    if (data.image) embed.setImage(data.image);

    if (data.fields && Array.isArray(data.fields)) {
        embed.addFields(data.fields.map(f => ({ name: f.name, value: f.value, inline: f.inline || false })));
    }

    return embed;
}

function buildButtons(buttonsData) {
    if (!buttonsData || buttonsData.length === 0) return [];

    const rows = [];
    let currentRow = new ActionRowBuilder();
    let count = 0;

    for (const btn of buttonsData) {
        if (count > 0 && count % 5 === 0) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }

        let button;

        if (btn.style === "link" && btn.url) {
            button = new ButtonBuilder()
                .setLabel(btn.label)
                .setURL(btn.url)
                .setStyle(ButtonStyle.Link);
        } else {
            button = new ButtonBuilder()
                .setCustomId(btn.customId || "btn_" + count)
                .setLabel(btn.label)
                .setStyle(ButtonStyle.Primary);
        }

        if (btn.emoji) button.setEmoji(btn.emoji);

        currentRow.addComponents(button);
        count++;
    }

    if (currentRow.components.length > 0) {
        rows.push(currentRow);
    }

    return rows;
}

function createPremiumEmbed(title, description, color) {
    const c = color || 0x2B2D42;
    return new EmbedBuilder()
        .setColor(c)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: "YSER Flow" })
        .setTimestamp();
}

module.exports = { buildEmbed, buildButtons, createPremiumEmbed };
