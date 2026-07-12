require("dotenv").config();

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,

    // XP Settings
    xp: {
        perMessage: 10,
        cooldownSeconds: 20,
        levelFormula: (level) => Math.floor(100 * Math.pow(2.0, level - 1))
    },

    // Embed Design
    embed: {
        color: 0x474747,
        footer: "YSER Flow",
        thumbnail: null
    },

    // Futures Pairs
    futuresPairs: [
        { symbol: "NQ", tickSize: 0.25, tickValue: 5, microSymbol: "MNQ", microTickValue: 0.5 },
        { symbol: "ES", tickSize: 0.25, tickValue: 12.5, microSymbol: "MES", microTickValue: 1.25 },
        { symbol: "YM", tickSize: 1, tickValue: 5, microSymbol: "MYM", microTickValue: 0.5 },
        { symbol: "RTY", tickSize: 0.1, tickValue: 5, microSymbol: "M2K", microTickValue: 0.5 },
        { symbol: "GC", tickSize: 0.1, tickValue: 10, microSymbol: "MGC", microTickValue: 1 },
        { symbol: "SI", tickSize: 0.005, tickValue: 25, microSymbol: "SIL", microTickValue: 5 }
    ]
};
