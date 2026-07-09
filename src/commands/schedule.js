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
                    { name: "Weekly", value: "weekly" }
                ))
            .addStringOption(opt => opt.setName("days").setDescription("Days of week (e.g. Mon,Wed,Fri) — for weekly repeat"))
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
            const daysStr = interaction.options.getString("days");

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
                // Default to today
                const now = new Date();
                targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
            }

            // If the time has already passed today and no specific date was given, schedule for tomorrow
            const now = new Date();
            if (!dateStr && targetDate <= now) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            // Parse days of week for weekly repeat
            let daysOfWeek = null;
            if (repeat === "weekly" && daysStr) {
                const dayMap = { "sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6 };
                daysOfWeek = daysStr.toLowerCase().split(",").map(d => dayMap[d.trim()]).filter(d => d !== undefined);
                if (daysOfWeek.length === 0) {
                    return interaction.reply({ content: "Invalid days format. Use: Mon,Wed,Fri or Sun,Tue,Thu", ephemeral: true });
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
                daysOfWeek: daysOfWeek,
                timeHour: hour,
                timeMinute: minute,
                createdBy: interaction.user.id
            };

            await writeJSON("schedules.json", schedules);

            let desc = "**" + embedName + "** scheduled for " + targetDate.toLocaleString() + "\nChannel: " + channel.toString() + "\nRepeat: " + repeat;
            if (daysOfWeek) {
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                desc += "\nDays: " + daysOfWeek.map(d => dayNames[d]).join(", ");
            }

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
                let line = "• **" + s.embedName + "** — " + new Date(s.nextRun).toLocaleString() + " (" + s.repeat + ")";
                if (s.daysOfWeek) {
                    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    line += " [" + s.daysOfWeek.map(d => dayNames[d]).join(",") + "]";
                }
                return line;
            }).join("\n");

            const embed = new EmbedBuilder()
                .setColor(0x2B2D42)
                .setTitle("📅 Scheduled Messages")
                .setDescription(description)
                .setFooter({ text: "YSER Flow" })
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
