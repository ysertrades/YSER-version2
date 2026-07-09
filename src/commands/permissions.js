const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../utils/jsonManager");
const { isOwner } = require("../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("permissions")
        .setDescription("Permission system")
        .addSubcommand(sub =>
            sub.setName("set").setDescription("Set role permission for a command")
            .addStringOption(opt => opt.setName("command").setDescription("Command name").setRequired(true))
            .addRoleOption(opt => opt.setName("role").setDescription("Role").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("list").setDescription("List all permission overrides")
        )
        .addSubcommand(sub =>
            sub.setName("remove").setDescription("Remove a permission override")
            .addStringOption(opt => opt.setName("command").setDescription("Command name").setRequired(true))
        ),

    async execute(interaction) {
        if (!(await isOwner(interaction))) {
            return interaction.reply({ content: "❌ Server owner only.", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const perms = await readJSON("permissions.json");
        if (!perms[interaction.guildId]) perms[interaction.guildId] = {};

        if (sub === "set") {
            const command = interaction.options.getString("command");
            const role = interaction.options.getRole("role");

            perms[interaction.guildId][command] = { roleId: role.id, roleName: role.name };
            await writeJSON("permissions.json", perms);

            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setDescription(`✅ **/${command}** now requires **${role.name}**`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "list") {
            const guildPerms = perms[interaction.guildId] || {};
            const entries = Object.entries(guildPerms);

            if (entries.length === 0) {
                return interaction.reply({ content: "No permission overrides.", ephemeral: true });
            }

            const description = entries.map(([cmd, p]) => `• **/${cmd}** → <@&${p.roleId}>`).join("\n");
            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setTitle("🔐 Permissions")
                .setDescription(description);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "remove") {
            const command = interaction.options.getString("command");
            if (perms[interaction.guildId][command]) {
                delete perms[interaction.guildId][command];
                await writeJSON("permissions.json", perms);
                await interaction.reply({ content: `✅ Removed permission for **/${command}**`, ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ No permission set for **/${command}**`, ephemeral: true });
            }
        }
    }
};
