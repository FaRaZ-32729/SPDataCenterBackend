const WebSocket = require("ws");

const SERVER_URL = "wss://polekit.iotfiysolutions.com/ws/alerts";

// Dummy devices
const DEVICES = [
    "device-001",
    "device-002",
    "device-003",
    "device-004",
    "device-005",
    "device-006",
];

// Function to randomly return "DETECTED" or "NORMAL"
function randomVoltageStatus() {
    return Math.random() > 0.8 ? "DETECTED" : "NORMAL";
}

// Simulate single device connection
function simulateDevice(deviceId) {
    const ws = new WebSocket(SERVER_URL);

    ws.on("open", () => {
        console.log(`[${deviceId}] Connected to WebSocket Server`);

        // send data every 10 seconds
        const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                const payload = {
                    deviceId,
                    voltage: randomVoltageStatus(),
                };

                ws.send(JSON.stringify(payload));
                console.log(`[${deviceId}] Sent:`, payload);
            }
        }, 10000);

        ws.on("close", () => {
            console.log(`[${deviceId}] Disconnected from server`);
            clearInterval(interval);
        });

        ws.on("error", (err) => {
            console.error(`[${deviceId}] WebSocket Error:`, err.message);
        });

        ws.on("message", (msg) => {
            console.log(`[${deviceId}] Message from server: ${msg.toString()}`);
        });
    });
}

// Start simulation for all devices
DEVICES.forEach((id) => simulateDevice(id));
