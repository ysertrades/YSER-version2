const { readJSON, writeJSON } = require("./jsonManager");
const { buildEmbed, buildButtons } = require("./embedBuilder");

let client;

function initScheduler(discordClient) {
    client = discordClient;
    checkSchedules();
    setInterval(checkSchedules, 30000);
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
                    } else if (schedule.repeat === "weekdays") {
                        const next = new Date(scheduleTime);
                        const day = next.getDay();
                        if (day === 5) { // Friday -> Monday
                            next.setDate(next.getDate() + 3);
                        } else if (day === 6) { // Saturday -> Monday
                            next.setDate(next.getDate() + 2);
                        } else {
                            next.setDate(next.getDate() + 1);
                        }
                        schedule.nextRun = next.toISOString();
                    } else if (schedule.repeat === "weekly") {
                        const next = new Date(scheduleTime);
                        next.setDate(next.getDate() + 7);
                        schedule.nextRun = next.toISOString();
                    } else {
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

module.exports = { initScheduler };
