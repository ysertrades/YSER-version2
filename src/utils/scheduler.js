const { readJSON, writeJSON } = require("./jsonManager");
const { buildEmbed } = require("./embedBuilder");

let client;

function initScheduler(discordClient) {
    client = discordClient;
    checkSchedules();
    setInterval(checkSchedules, 60000); // Check every minute
}

async function checkSchedules() {
    const schedules = await readJSON("schedules.json");
    const now = new Date();

    for (const [guildId, guildSchedules] of Object.entries(schedules)) {
        for (const [scheduleId, schedule] of Object.entries(guildSchedules)) {
            const scheduleTime = new Date(schedule.nextRun);

            if (now >= scheduleTime) {
                try {
                    const channel = await client.channels.fetch(schedule.channelId);
                    if (channel) {
                        const embeds = require("./embedBuilder");
                        const embed = buildEmbed(schedule.embedData);
                        const buttons = embeds.buildButtons(schedule.embedData.buttons || []);
                        await channel.send({ embeds: [embed], components: buttons });
                    }

                    // Update next run time
                    if (schedule.repeat === "daily") {
                        schedule.nextRun = new Date(scheduleTime.getTime() + 86400000).toISOString();
                    } else if (schedule.repeat === "weekly") {
                        schedule.nextRun = new Date(scheduleTime.getTime() + 604800000).toISOString();
                    } else {
                        delete guildSchedules[scheduleId];
                    }

                    await writeJSON("schedules.json", schedules);
                } catch (err) {
                    console.error(`Schedule error: ${err.message}`);
                }
            }
        }
    }
}

module.exports = { initScheduler };
