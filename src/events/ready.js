const { Events } = require("discord.js");
const { initScheduler } = require("../utils/scheduler");

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`✅ ${client.user.tag} is online`);
        initScheduler(client);
    }
};
