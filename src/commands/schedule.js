const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../utils/jsonManager");
const { isOwner } = require("../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("schedule")
        .setDescription("Message scheduler")
        .addSubcommand(sub =>
            sub.setName("create").setDescription("Schedule a message")
            .addStringOption(opt => opt.setName("embed").setDescription("Saved embed name").setRequired(true))
            .addChannelOption(opt => opt.setName("channel").setDescription("Target channel").setRequired(true))
            .addStringOption(opt => opt.setName("date").setDescription("Date (YYYY-MM-DD)").setRequired(true))
            .addStringOption(opt => opt.setName("time").setDescription("Time (HH:MM, 24h)").setRequired(true))
            .addStringOption(opt => opt.setName("repeat").setDescription("Repeat frequency")
                .addChoices(
                    { name: "One-time", value: "once" },
                    { name: "Daily", value: "daily" },
                    { name: "Weekly", value: "weekly" }
                ))
        )
        .addSubcommand(sub =>
            sub.setName("list").setDescription("List scheduled messages")
        )
        .addSubcommand(sub =>
            sub.setName("delete").setDescription("Delete a schedule")
            .addStringOption(opt => opt.setName("id").setDescription("Schedule ID").setRequired(true))
        ),

    async execute(interaction) {
        if (!(await isOwner(interaction))) {
            return interaction.reply({ content: "Server owner only.", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const schedules = await readJSON("schedules.json");

        if (sub === "create") {
            const embedName = interaction.options.getString("embed");
            const channel = interaction.options.getChannel("channel");
            const dateStr = interaction.options.getString("date");
            const timeStr = interaction.options.getString("time");
            const repeat = interaction.options.getString("repeat") || "once";

            const embeds = await readJSON("embeds.json");
            const guildEmbeds = embeds[interaction.guildId] || {};
            const embedData = guildEmbeds[embedName];

            if (!embedData) {
                return interaction.reply({ content: "Embed **" + embedName + "** not found.", ephemeral: true });
            }

            const [year, month, day] = dateStr.split("-").map(Number);
            const [hour, minute] = timeStr.split(":").map(Number);
            const nextRun = new Date(year, month - 1, day, hour, minute);

            if (isNaN(nextRun.getTime()) || nextRun <= new Date()) {
                return interaction.reply({ content: "Invalid date/time. Must be in the future.", ephemeral: true });
            }

            const scheduleId = "sched_" + Date.now();
            if (!schedules[interaction.guildId]) schedules[interaction.guildId] = {};
            
            schedules[interaction.guildId][scheduleId] = {
                embedName: embedName,
                embedData: embedData,
                channelId: channel.id,
                nextRun: nextRun.toISOString(),
                repeat: repeat,
                createdBy: interaction.user.id
            };

            await writeJSON("schedules.json", schedules);

            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setTitle("Scheduled")
                .setDescription("**" + embedName + "** scheduled for " + dateStr + " " + timeStr + "\nChannel: " + channel.toString() + "\nRepeat: " + repeat)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "list") {
            const guildSchedules = schedules[interaction.guildId] || {};
            const entries = Object.entries(guildSchedules);

            if (entries.length === 0) {
                return interaction.reply({ content: "No scheduled messages.", ephemeral: true });
            }

            const description = entries.map(([id, s]) => 
                "• **" + s.embedName + "** — " + new Date(s.nextRun).toLocaleString() + " (" + s.repeat + ")"
            ).join("\n");

            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setTitle("Scheduled Messages")
                .setDescription(description)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "delete") {
            const scheduleId = interaction.options.getString("id");
            if (schedules[interaction.guildId]?.[scheduleId]) {
                delete schedules[interaction.guildId][scheduleId];
                await writeJSON("schedules.json", schedules);
                await interaction.reply({ content: "Schedule deleted.", ephemeral: true });
            } else {
                await interaction.reply({ content: "Schedule not found.", ephemeral: true });
            }
        }
    }
};
