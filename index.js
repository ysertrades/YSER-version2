const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember]
});

client.commands = new Collection();
client.cooldowns = new Collection();

["commandHandler", "eventHandler", "interactionHandler"].forEach((handler) => {
    require("./src/handlers/" + handler)(client);
});

client.login(process.env.TOKEN);
