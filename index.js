const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
require("dotenv").config();
const config = require("./config");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
client.cooldowns = new Collection();

// Load handlers
["commandHandler", "eventHandler", "interactionHandler"].forEach((handler) => {
    require(`./src/handlers/${handler}`)(client);
});

client.login(config.token);
