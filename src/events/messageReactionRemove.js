const { Events } = require("discord.js");
const { readJSON } = require("../utils/jsonManager");

module.exports = {
    name: Events.MessageReactionRemove,
    once: false,
    async execute(reaction, user) {
        if (user.bot) return;

        try {
            if (reaction.partial) await reaction.fetch();
            if (reaction.message.partial) await reaction.message.fetch();
        } catch (err) {
            return;
        }

        const { readJSON } = require("../utils/jsonManager");
        const embeds = await readJSON("embeds.json");

        if (!embeds) return;

        for (const [guildId, guildEmbeds] of Object.entries(embeds)) {
            if (!guildEmbeds) continue;
            for (const [name, data] of Object.entries(guildEmbeds)) {
                if (!data.reactionRoles || !data.messageId) continue;

                if (data.messageId === reaction.message.id) {
                    const roleMapping = data.reactionRoles.find(r => r.emoji === reaction.emoji.name || r.emoji === reaction.emoji.toString());
                    if (roleMapping) {
                        try {
                            const member = await reaction.message.guild.members.fetch(user.id);
                            const role = await reaction.message.guild.roles.fetch(roleMapping.roleId);
                            if (member && role) {
                                await member.roles.remove(roleMapping.roleId);
                            }
                        } catch (err) {
                            console.error("Reaction role remove error:", err.message);
                        }
                    }
                }
            }
        }
    }
};
