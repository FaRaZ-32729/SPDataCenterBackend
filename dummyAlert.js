const WebSocket = require("ws");

// ================= CONFIG =================
const HUB_ID = "696a3fd213d499c0f40ef98d";
const WS_SERVER_URL = "ws://localhost:5053/ws/alerts";
const SENSOR_COUNT = 15;
const INTERVAL_MS =  10000; // 1 minute

// ================= SENSOR LIST =================
const sensors = Array.from({ length: SENSOR_COUNT }, (_, i) => ({
    sensorName: `S-${i + 1}`,
}));

// ================= WEBSOCKET CONNECTION =================
const ws = new WebSocket(WS_SERVER_URL);

ws.on("open", () => {
    console.log("✅ Hub connected to backend:", HUB_ID);
    console.log(`📡 Simulating ${SENSOR_COUNT} sensors`);

    setInterval(() => {
        console.log("⏱️ Sending sensor batch...");

        sensors.forEach((sensor) => {
            const payload = {
                hubId: HUB_ID,
                sensorName: sensor.sensorName,
                temperature: getRandomTemp(),
                humidity: getRandomHumidity(),
                timestamp: new Date().toISOString(),
            };

            ws.send(JSON.stringify(payload));
            console.log("📤 Sent:", payload);
        });
    }, INTERVAL_MS);
});

ws.on("error", (err) => {
    console.error("❌ WebSocket error:", err.message);
});

ws.on("close", () => {
    console.log("🔌 Hub disconnected");
});

// ================= HELPERS =================
function getRandomTemp() {
    return Number((20 + Math.random() * 20).toFixed(2)); // 20–40°C
}

function getRandomHumidity() {
    return Number((30 + Math.random() * 50).toFixed(2)); // 30–80%
}
