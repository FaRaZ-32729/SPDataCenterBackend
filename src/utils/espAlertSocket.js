const WebSocket = require("ws");

const HubModel = require("../models/hubModel");
const SensorModel = require("../models/sersorModel");
const RackModel = require("../models/rackModel");

const espAlertSocket = () => {
    const wSocket = new WebSocket.Server({ noServer: true });
    console.log("✅ WebSocket initialized");

    wSocket.on("connection", (ws) => {
        console.log("📡 Hub connected");

        ws.on("message", async (message) => {
            try {
                const data = JSON.parse(message.toString());
                console.log("📥 Data From Hub =>", data);

                const { hubId, sensorName, temperature, humidity } = data;
                if (!hubId || !sensorName) return;

                // 1️⃣ Validate Hub
                const hub = await HubModel.findById(hubId);
                if (!hub) return;

                // 2️⃣ Validate Sensor
                const sensor = await SensorModel.findOne({ hubId, sensorName });
                if (!sensor) {
                    console.log(`⚠️ Ignored: Sensor ${sensorName} not registered`);
                    return;
                }

                // 3️⃣ FIND RACK THAT CONTAINS THIS SENSOR
                const rack = await RackModel.findOne({
                    "hub.id": hub._id,
                    "sensors._id": sensor._id,
                });

                if (!rack) {
                    console.log(
                        `⚠️ Ignored: Sensor ${sensorName} not mapped to any rack`
                    );
                    return;
                }

                // ================= SENSOR UPDATE =================

                const sensorIndex = rack.sensorValues.findIndex(
                    (s) => s.sensorId.toString() === sensor._id.toString()
                );

                if (sensorIndex !== -1) {
                    // Update existing sensor
                    rack.sensorValues[sensorIndex].temperature = temperature;
                    rack.sensorValues[sensorIndex].humidity = humidity;
                    rack.sensorValues[sensorIndex].updatedAt = new Date();
                } else {
                    // Push new sensor
                    rack.sensorValues.push({
                        sensorId: sensor._id,
                        sensorName,
                        temperature,
                        humidity,
                        updatedAt: new Date(),
                    });
                }

                // ================= DOMINANT SENSOR =================

                let dominantSensor = null;

                rack.sensorValues.forEach((s) => {
                    if (!dominantSensor || s.temperature > dominantSensor.temperature) {
                        dominantSensor = s;
                    }
                });

                const maxTemp = dominantSensor.temperature;
                const maxHumi = dominantSensor.humidity;

                // ================= CONDITION CHECK =================

                let tempA = false;
                let humiA = false;

                rack.conditions.forEach((condition) => {
                    if (condition.type === "temp") {
                        if (
                            (condition.operator === ">" && maxTemp > condition.value) ||
                            (condition.operator === "<" && maxTemp < condition.value)
                        ) {
                            tempA = true;
                        }
                    }

                    if (condition.type === "humidity") {
                        if (
                            (condition.operator === ">" && maxHumi > condition.value) ||
                            (condition.operator === "<" && maxHumi < condition.value)
                        ) {
                            humiA = true;
                        }
                    }
                });

                // ================= UPDATE RACK =================

                rack.tempA = tempA;
                rack.humiA = humiA;
                // rack.tempV = maxTemp;
                // rack.humiV = maxHumi;

                await rack.save();

                console.log("✅ Rack Updated:", {
                    rack: rack.name,
                    updatedBy: sensorName,
                    dominantSensor: dominantSensor.sensorName,
                    tempV: maxTemp,
                    humiV: maxHumi,
                });

                ws.send(
                    JSON.stringify({
                        status: "ok",
                        rack: rack.name,
                        dominantSensor: dominantSensor.sensorName,
                        values: { temperature: maxTemp, humidity: maxHumi },
                        alerts: { tempA, humiA },
                    })
                );
            } catch (err) {
                console.error("🔥 WebSocket error:", err.message);
            }
        });

        ws.on("close", () => console.log("🔌 Hub disconnected"));
        ws.on("error", (err) =>
            console.error("❌ WebSocket error:", err.message)
        );
    });

    return wSocket;
};

module.exports = { espAlertSocket };
