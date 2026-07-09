const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("View user information")
        .addUserOption(opt => opt.setName("user").setDescription("User to check")),

    async execute(interaction) {
        const user = interaction.options.getUser("user") || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        const created = Math.floor(user.createdTimestamp / 1000);
        const joined = member ? Math.floor(member.joinedTimestamp / 1000) : "N/A";

        const embed = new EmbedBuilder()
            .setColor(0x2B2D42)
            .setTitle("👤 " + user.tag)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "ID", value: user.id, inline: true },
                { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
                { name: "Account Created", value: "<t:" + created + ":R>", inline: true },
                { name: "Joined Server", value: joined !== "N/A" ? "<t:" + joined + ":R>" : "N/A", inline: true }
            )
            .setFooter({ text: "YSER Flow" })
            .setTimestamp();

        if (member) {
            const roles = member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join(", ") || "None";
            embed.addFields({ name: "Roles (" + member.roles.cache.size + ")", value: roles, inline: false });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
