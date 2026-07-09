const { readJSON, writeJSON } = require("./jsonManager");
const { buildEmbed, buildButtons } = require("./embedBuilder");

let client;

function initScheduler(discordClient) {
    client = discordClient;
    checkSchedules();
    setInterval(checkSchedules, 60000);
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
                        const embed = buildEmbed(schedule.embedData);
                        const buttons = buildButtons(schedule.embedData.buttons || []);
                        await channel.send({ embeds: [embed], components: buttons });
                    }
                    
                    if (schedule.repeat === "daily") {
                        schedule.nextRun = new Date(scheduleTime.getTime() + 86400000).toISOString();
                    } else if (schedule.repeat === "weekly") {
                        schedule.nextRun = new Date(scheduleTime.getTime() + 604800000).toISOString();
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
