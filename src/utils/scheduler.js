const { readJSON, writeJSON } = require("./jsonManager");
const { buildEmbed, buildButtons } = require("./embedBuilder");

let client;

function initScheduler(discordClient) {
    client = discordClient;
    checkSchedules();
    setInterval(checkSchedules, 30000); // Check every 30 seconds for better accuracy
}

async function checkSchedules() {
    const schedules = await readJSON("schedules.json");
    const now = new Date();

    for (const [guildId, guildSchedules] of Object.entries(schedules)) {
        if (!guildSchedules) continue;

        for (const [scheduleId, schedule] of Object.entries(guildSchedules)) {
            const scheduleTime = new Date(schedule.nextRun);

            if (now >= scheduleTime) {
                try {
                    const channel = await client.channels.fetch(schedule.channelId);
                    if (channel) {
                        const embed = buildEmbed(schedule.embedData);
                        const buttons = buildButtons(schedule.embedData.buttons || []);
                        await channel.send({ embeds: [embed], components: buttons });
                    }

                    // Calculate next run time
                    if (schedule.repeat === "daily") {
                        const next = new Date(scheduleTime);
                        next.setDate(next.getDate() + 1);
                        schedule.nextRun = next.toISOString();
                    } else if (schedule.repeat === "weekly") {
                        if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
                            // Find next occurrence on specified days
                            const next = findNextDayOfWeek(scheduleTime, schedule.daysOfWeek, schedule.timeHour, schedule.timeMinute);
                            schedule.nextRun = next.toISOString();
                        } else {
                            // Default: same day next week
                            const next = new Date(scheduleTime);
                            next.setDate(next.getDate() + 7);
                            schedule.nextRun = next.toISOString();
                        }
                    } else {
                        // One-time: delete after sending
                        delete guildSchedules[scheduleId];
                    }

                    await writeJSON("schedules.json", schedules);
                } catch (err) {
                    console.error("Schedule error: " + err.message);
                }
            }
        }
    }
}

function findNextDayOfWeek(fromDate, daysOfWeek, hour, minute) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDay = fromDate.getDay();

    // Sort days to find the next one
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

    // Find next day after current
    let nextDay = sortedDays.find(d => d > currentDay);

    if (nextDay === undefined) {
        // Wrap around to next week
        nextDay = sortedDays[0];
    }

    const result = new Date(fromDate);
    const daysToAdd = (nextDay - currentDay + 7) % 7;
    result.setDate(result.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
    result.setHours(hour, minute, 0, 0);

    return result;
}

module.exports = { initScheduler };
