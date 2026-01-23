const WebSocket = require("ws");

const HubModel = require("../models/hubModel");
const SensorModel = require("../models/sersorModel");
const RackModel = require("../models/rackModel");

const espAlertSocket = () => {
    const wSocket = new WebSocket.Server({ noServer: true });
    console.log("ESP32 Alert WebSocket initialized");

    wSocket.on("connection", (ws) => {
        console.log("Hub connected");

        ws.on("message", async (message) => {
            try {
                const data = JSON.parse(message.toString());
                console.log("Data From Hub =>", data);

                const { hubId, sensorName, temperature, humidity } = data;
                if (!hubId || !sensorName) return;

                // Validate Hub
                const hub = await HubModel.findById(hubId);
                if (!hub) return;

                // Validate Sensor
                const sensor = await SensorModel.findOne({ hubId, sensorName });
                if (!sensor) {
                    console.log(`Ignored: Sensor ${sensorName} not registered`);
                    return;
                }

                // Find the rack that contains this sensor
                const rack = await RackModel.findOne({
                    "hub.id": hub._id,
                    "sensors._id": sensor._id,
                });

                if (!rack) {
                    console.log(`Ignored: Sensor ${sensorName} not mapped to any rack`);
                    return;
                }

                // ================= Rebuild Sensor Values from scratch =================
                const newSensorValues = [];

                for (let s of rack.sensors) {
                    let value = null;

                    // If incoming data is for this sensor, use it
                    if (s._id.toString() === sensor._id.toString()) {
                        value = { temperature, humidity, sensorName: s.name };
                    } else {
                        // Check if we already have old values for this sensor
                        const oldValue = rack.sensorValues.find(v => v.sensorId.toString() === s._id.toString());
                        if (oldValue) {
                            value = {
                                temperature: oldValue.temperature,
                                humidity: oldValue.humidity,
                                sensorName: s.name
                            };
                        }
                    }

                    if (value) {
                        newSensorValues.push({
                            sensorId: s._id,
                            sensorName: value.sensorName,
                            temperature: value.temperature,
                            humidity: value.humidity,
                            updatedAt: new Date(),
                        });
                    }
                }

                // Assign the rebuilt array
                rack.sensorValues = newSensorValues;

                // ================= Find Dominant Sensor =================
                const validSensors = rack.sensorValues.filter(s => s.temperature != null);

                let dominantSensor = null;
                let maxTemp = null;
                let maxHumi = null;

                if (validSensors.length > 0) {
                    dominantSensor = validSensors.reduce((max, s) =>
                        s.temperature > max.temperature ? s : max
                        , validSensors[0]);

                    maxTemp = dominantSensor.temperature;
                    maxHumi = dominantSensor.humidity;

                    console.log(
                        "Dominant Sensor:", dominantSensor.sensorName,
                        "Temp:", maxTemp,
                        "Humi:", maxHumi
                    );
                } else {
                    console.log("No sensor with valid temperature found!");
                }

                // ================= Check Conditions =================
                let tempA = false;
                let humiA = false;

                rack.conditions.forEach(condition => {
                    if (condition.type === "temp" && maxTemp != null) {
                        if ((condition.operator === ">" && maxTemp > condition.value) ||
                            (condition.operator === "<" && maxTemp < condition.value)) {
                            tempA = true;
                        }
                    }
                    if (condition.type === "humidity" && maxHumi != null) {
                        if ((condition.operator === ">" && maxHumi > condition.value) ||
                            (condition.operator === "<" && maxHumi < condition.value)) {
                            humiA = true;
                        }
                    }
                });

                // ================= Update Rack =================
                // rack.tempA = tempA;
                // rack.humiA = humiA;
                // rack.tempV = maxTemp;
                // rack.humiV = maxHumi;

                // await rack.save();
                await RackModel.updateOne(
                    { _id: rack._id },
                    {
                        $set: {
                            sensorValues: newSensorValues,
                            tempA,
                            humiA,
                            tempV: maxTemp,
                            humiV: maxHumi,
                        }
                    }
                );

                console.log("Rack Updated:", {
                    rack: rack.name,
                    updatedBy: sensorName,
                    dominantSensor: dominantSensor ? dominantSensor.sensorName : "N/A",
                    sensorValuesCount: rack.sensorValues.length
                });

                // ================= Send Response =================
                ws.send(JSON.stringify({
                    status: "ok",
                    rack: rack.name,
                    dominantSensor: dominantSensor ? dominantSensor.sensorName : null,
                    values: { temperature: maxTemp, humidity: maxHumi },
                    alerts: { tempA, humiA },
                }));

            } catch (err) {
                console.error("WebSocket error:", err.message);
            }
        });

        ws.on("close", () => console.log("Hub disconnected"));
        ws.on("error", (err) => console.error("WebSocket error:", err.message));
    });

    return wSocket;
};

module.exports = { espAlertSocket };
