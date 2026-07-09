const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { checkPermission } = require("../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Clear messages")
        .addSubcommand(sub =>
            sub.setName("messages").setDescription("Clear amount of messages")
            .addIntegerOption(opt => opt.setName("amount").setDescription("Number of messages (1-100)").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("user").setDescription("Clear messages from a user")
            .addUserOption(opt => opt.setName("user").setDescription("User").setRequired(true))
            .addIntegerOption(opt => opt.setName("amount").setDescription("Number of messages (1-100)").setRequired(true))
        ),

    async execute(interaction) {
        if (!(await checkPermission(interaction, "clear"))) {
            return interaction.reply({ content: "You don't have permission.", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const channel = interaction.channel;

        if (sub === "messages") {
            const amount = interaction.options.getInteger("amount");
            if (amount < 1 || amount > 100) {
                return interaction.reply({ content: "Amount must be between 1 and 100.", ephemeral: true });
            }
            const deleted = await channel.bulkDelete(amount, true).catch(() => null);
            if (!deleted) return interaction.reply({ content: "Could not delete messages.", ephemeral: true });
            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setDescription("🧹 Cleared **" + deleted.size + "** messages.")
                .setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed] });
            setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
        }

        if (sub === "user") {
            const user = interaction.options.getUser("user");
            const amount = interaction.options.getInteger("amount");
            if (amount < 1 || amount > 100) {
                return interaction.reply({ content: "Amount must be between 1 and 100.", ephemeral: true });
            }
            const messages = await channel.messages.fetch({ limit: 100 });
            const userMessages = messages.filter(m => m.author.id === user.id).first(amount);
            for (const msg of userMessages) {
                await msg.delete().catch(() => {});
            }
            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setDescription("🧹 Cleared **" + userMessages.length + "** messages from **" + user.tag + "**.")
                .setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed] });
            setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
        }
    }
};
