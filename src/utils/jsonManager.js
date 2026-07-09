const fs = require("fs").promises;
const path = require("path");

const dataDir = path.join(__dirname, "../data");

// In-memory cache
const cache = {};

async function readJSON(filename) {
    if (cache[filename]) return cache[filename];

    const filePath = path.join(dataDir, filename);
    try {
        const data = await fs.readFile(filePath, "utf8");
        cache[filename] = JSON.parse(data);
        return cache[filename];
    } catch {
        cache[filename] = {};
        return cache[filename];
    }
}

async function writeJSON(filename, data) {
    cache[filename] = data;
    const filePath = path.join(dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function getCache(filename) {
    return cache[filename] || {};
}

module.exports = { readJSON, writeJSON, getCache };
