const { readJSON } = require("./jsonManager");

async function isOwner(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();
    return interaction.user.id === owner.id;
}

async function checkPermission(interaction, commandName) {
    if (await isOwner(interaction)) return true;

    const perms = await readJSON("permissions.json");
    const guildPerms = perms[interaction.guildId] || {};
    const cmdPerms = guildPerms[commandName];

    if (!cmdPerms) return false;

    const member = interaction.member;
    return member.roles.cache.has(cmdPerms.roleId);
}

module.exports = { isOwner, checkPermission };
