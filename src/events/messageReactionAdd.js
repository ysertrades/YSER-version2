const { Events } = require("discord.js");

module.exports = {
    name: Events.MessageReactionAdd,
    once: false,
    async execute(reaction, user) {
        if (user.bot) return;

        const { readJSON } = require("../utils/jsonManager");
        const embeds = await readJSON("embeds.json");

        for (const [name, data] of Object.entries(embeds)) {
            if (data.reactionRoles && data.messageId === reaction.message.id) {
                const roleMapping = data.reactionRoles.find(r => r.emoji === reaction.emoji.name);
                if (roleMapping) {
                    const member = await reaction.message.guild.members.fetch(user.id);
                    await member.roles.add(roleMapping.roleId);
                }
            }
        }
    }
};
