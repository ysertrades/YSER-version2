const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function buildEmbed(data) {
    const embed = new EmbedBuilder()
        .setColor(data.color || 0x2B2D42);

    if (data.title) embed.setTitle(data.title);
    if (data.description) embed.setDescription(data.description);
    if (data.footer) embed.setFooter({ text: data.footer });
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

    buttonsData.forEach((btn, index) => {
        if (index > 0 && index % 5 === 0) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }

        const button = new ButtonBuilder()
            .setCustomId(btn.customId || `btn_${index}`)
            .setLabel(btn.label)
            .setStyle(btn.style === "link" ? ButtonStyle.Link : ButtonStyle.Primary);

        if (btn.style === "link" && btn.url) {
            button.setURL(btn.url);
            button.setStyle(ButtonStyle.Link);
        }

        if (btn.emoji) button.setEmoji(btn.emoji);

        currentRow.addComponents(button);
    });

    rows.push(currentRow);
    return rows;
}

function createPremiumEmbed(title, description, color = 0x2B2D42) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: "YSER SAPPHIRE" })
        .setTimestamp();
}

module.exports = { buildEmbed, buildButtons, createPremiumEmbed };
