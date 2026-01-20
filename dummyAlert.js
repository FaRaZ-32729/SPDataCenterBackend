const WebSocket = require("ws");

// ================= CONFIG =================
const HUB_ID = "696a3fd213d499c0f40ef98d"; 
const WS_SERVER_URL = "ws://localhost:5053/ws/alerts";

// Simulate 1–15 sensors
const SENSOR_COUNT = Math.floor(Math.random() * 15) + 1;

// ================= SENSOR LIST =================
const sensors = Array.from({ length: SENSOR_COUNT }, (_, index) => ({
    sensorName: `S-${index + 1}`,
}));

// ================= WEBSOCKET CONNECTION =================
const ws = new WebSocket(WS_SERVER_URL);

ws.on("open", () => {
    console.log("✅ Hub connected to backend:", HUB_ID);

    // Send data every 5 seconds
    setInterval(() => {
        sensors.forEach((sensor) => {
            const payload = {
                hubId: HUB_ID,
                sensorName: sensor.sensorName,
                temperature: getRandomTemp(),
                humidity: getRandomHumidity(),
                timestamp: new Date().toISOString(),
            };

            ws.send(JSON.stringify(payload));
            console.log("📡 Data sent:", payload);
        });
    }, 60 * 1000);
});

ws.on("error", (err) => {
    console.error("❌ WebSocket error:", err.message);
});

ws.on("close", () => {
    console.log("🔌 Hub disconnected");
});

// ================= HELPERS =================
function getRandomTemp() {
    return +(20 + Math.random() * 20).toFixed(2);
}

function getRandomHumidity() {
    return +(30 + Math.random() * 50).toFixed(2);
}