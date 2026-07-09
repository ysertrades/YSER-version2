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
            .addStringOption(opt => opt.setName("time").setDescription("Time (HH:MM, 24h format)").setRequired(true))
            .addStringOption(opt => opt.setName("date").setDescription("Date (YYYY-MM-DD) — optional, defaults to today"))
            .addStringOption(opt => opt.setName("repeat").setDescription("Repeat frequency")
                .addChoices(
                    { name: "One-time", value: "once" },
                    { name: "Daily", value: "daily" },
                    { name: "Weekdays (Mon-Fri)", value: "weekdays" },
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
            const timeStr = interaction.options.getString("time");
            const dateStr = interaction.options.getString("date");
            const repeat = interaction.options.getString("repeat") || "once";

            const embeds = await readJSON("embeds.json");
            const guildEmbeds = embeds[interaction.guildId] || {};
            const embedData = guildEmbeds[embedName];

            if (!embedData) {
                return interaction.reply({ content: "Embed **" + embedName + "** not found.", ephemeral: true });
            }

            // Parse time
            const [hour, minute] = timeStr.split(":").map(Number);
            if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                return interaction.reply({ content: "Invalid time format. Use HH:MM (24h).", ephemeral: true });
            }

            // Parse date (optional, defaults to today)
            let targetDate;
            if (dateStr) {
                const [year, month, day] = dateStr.split("-").map(Number);
                targetDate = new Date(year, month - 1, day, hour, minute, 0, 0);
                if (isNaN(targetDate.getTime())) {
                    return interaction.reply({ content: "Invalid date format. Use YYYY-MM-DD.", ephemeral: true });
                }
            } else {
                const now = new Date();
                targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
            }

            // For weekdays, if today is weekend, find next Monday
            if (repeat === "weekdays") {
                const day = targetDate.getDay();
                if (day === 0) { // Sunday
                    targetDate.setDate(targetDate.getDate() + 1);
                } else if (day === 6) { // Saturday
                    targetDate.setDate(targetDate.getDate() + 2);
                }
            }

            const scheduleId = "sched_" + Date.now();
            if (!schedules[interaction.guildId]) schedules[interaction.guildId] = {};

            schedules[interaction.guildId][scheduleId] = {
                embedName: embedName,
                embedData: embedData,
                channelId: channel.id,
                nextRun: targetDate.toISOString(),
                repeat: repeat,
                timeHour: hour,
                timeMinute: minute,
                createdBy: interaction.user.id
            };

            await writeJSON("schedules.json", schedules);

            let desc = "**" + embedName + "** scheduled for " + targetDate.toLocaleString() + "\nChannel: " + channel.toString() + "\nRepeat: " + repeat;
            desc += "\n**Schedule ID: `" + scheduleId + "`**";

            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setTitle("✅ Scheduled")
                .setDescription(desc)
                .setFooter({ text: "YSER Flow" })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "list") {
            const guildSchedules = schedules[interaction.guildId] || {};
            const entries = Object.entries(guildSchedules);

            if (entries.length === 0) {
                return interaction.reply({ content: "No scheduled messages.", ephemeral: true });
            }

            const description = entries.map(([id, s]) => {
                let line = "**`" + id + "`** — **" + s.embedName + "**\n";
                line += "📅 " + new Date(s.nextRun).toLocaleString() + " | 🔁 " + s.repeat;
                return line;
            }).join("\n\n");

            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setTitle("📅 Scheduled Messages")
                .setDescription(description)
                .setFooter({ text: "YSER Flow — Use /schedule delete id:<ID> to remove" })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === "delete") {
            const scheduleId = interaction.options.getString("id");
            if (schedules[interaction.guildId]?.[scheduleId]) {
                delete schedules[interaction.guildId][scheduleId];
                await writeJSON("schedules.json", schedules);
                await interaction.reply({ content: "✅ Schedule `" + scheduleId + "` deleted.", ephemeral: true });
            } else {
                await interaction.reply({ content: "❌ Schedule `" + scheduleId + "` not found.", ephemeral: true });
            }
        }
    }
};
