const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { checkPermission } = require("../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lock")
        .setDescription("Lock or unlock a channel")
        .addSubcommand(sub =>
            sub.setName("channel").setDescription("Lock a channel")
            .addChannelOption(opt => opt.setName("channel").setDescription("Channel to lock"))
        )
        .addSubcommand(sub =>
            sub.setName("unlock").setDescription("Unlock a channel")
            .addChannelOption(opt => opt.setName("channel").setDescription("Channel to unlock"))
        )
        .addSubcommand(sub =>
            sub.setName("slowmode").setDescription("Set slowmode")
            .addIntegerOption(opt => opt.setName("seconds").setDescription("Seconds (0 to disable)").setRequired(true))
            .addChannelOption(opt => opt.setName("channel").setDescription("Target channel"))
        )
        .addSubcommand(sub =>
            sub.setName("lockdown").setDescription("Lockdown entire server")
            .addStringOption(opt => opt.setName("state").setDescription("Enable or Disable").setRequired(true)
                .addChoices({ name: "Enable", value: "enable" }, { name: "Disable", value: "disable" }))
        ),

    async execute(interaction) {
        if (!(await checkPermission(interaction, "lock"))) {
            return interaction.reply({ content: "You don't have permission.", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();

        // --- LOCK CHANNEL ---
        if (sub === "channel") {
            const channel = interaction.options.getChannel("channel") || interaction.channel;
            
            // Deny SendMessages for @everyone
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { 
                SendMessages: false 
            });
            
            const embed = new EmbedBuilder()
                .setColor(0xE74C3C)
                .setDescription("🔒 **" + channel.toString() + "** has been locked.")
                .setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed] });
        }

        // --- UNLOCK CHANNEL ---
        if (sub === "unlock") {
            const channel = interaction.options.getChannel("channel") || interaction.channel;
            
            // FIX: Use true instead of null to explicitly allow sending
            // This overrides any category-level denies
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { 
                SendMessages: true 
            });
            
            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setDescription("🔓 **" + channel.toString() + "** has been unlocked.")
                .setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed] });
        }

        // --- SLOWMODE ---
        if (sub === "slowmode") {
            const seconds = interaction.options.getInteger("seconds");
            const channel = interaction.options.getChannel("channel") || interaction.channel;
            await channel.setRateLimitPerUser(seconds);
            
            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setDescription("🐌 Slowmode set to **" + seconds + "s** in " + channel.toString() + ".")
                .setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed] });
        }

        // --- LOCKDOWN (SERVER-WIDE) ---
        if (sub === "lockdown") {
            const state = interaction.options.getString("state");
            const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());
            
            for (const [, channel] of channels) {
                try {
                    if (state === "enable") {
                        // Lock: deny SendMessages
                        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { 
                            SendMessages: false 
                        });
                    } else {
                        // FIX: Unlock: explicitly allow SendMessages
                        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { 
                            SendMessages: true 
                        });
                    }
                } catch (e) {
                    console.error(`Failed to ${state} lockdown for ${channel.name}:`, e);
                }
            }
            
            const embed = new EmbedBuilder()
                .setColor(state === "enable" ? 0xE74C3C : 0x2ECC71)
                .setDescription(state === "enable" 
                    ? "🛑 Server lockdown **ENABLED**." 
                    : "✅ Server lockdown **DISABLED**.")
                .setFooter({ text: "YSER Flow" });
            await interaction.reply({ embeds: [embed] });
        }
    }
};
