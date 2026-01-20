// const WebSocket = require("ws");

// const espAlertSocket = (server) => {
//     const wSocket = new WebSocket.Server({ noServer: true });
//     console.log("web-socket initialized");

//     wSocket.on("connection", (ws, req) => {
//         const serverIp = req.socket.remoteAddress;
//         console.log(`esp32 connected from ${serverIp}`);


//         ws.on("message", async (message) => {
//             console.log(message.toString());

//             try {

//                 let data;

//                 try {
//                     data = JSON.parse(message);
//                     console.log("parsed json data => ", data);
//                 } catch {
//                     console.log("non-JSON message:", message.toString());
//                     return;
//                 }

//                 await deviceModel.findOneAndUpdate(
//                     { deviceId: data.deviceId },
//                     {
//                         voltage : data.voltage === "DETECTED"
//                     },
//                     { new: true }
//                 );
//             } catch (error) {
//                 console.log("trouble while getting data or updating Mongodb");
//                 console.error("error: ", error.message)
//             }

//         });

//         ws.on("close", (code, reason) => {
//             console.log(`esp32 disconnected (code: ${code} , reason: ${reason} )`);
//         });

//         ws.on("error", (error) => {
//             console.error("Web-Socket Error", error.message);
//         });

//         setTimeout(() => {
//             if (ws.readyState === WebSocket.OPEN) {
//                 ws.send('{"serverMsg : Hellow ESP32}');
//                 console.log("Confirmation Message Send to ESP32");
//             }
//         }, 1000);
//     });


//     return wSocket;
// }

// module.exports = { espAlertSocket };



const WebSocket = require("ws");
const mongoose = require("mongoose");

const HubModel = require("../models/hubModel");
const SensorModel = require("../models/sersorModel");
const RackModel = require("../models/rackModel");

const espAlertSocket = (server) => {
    const wSocket = new WebSocket.Server({ noServer: true });
    console.log("✅ WebSocket initialized");

    wSocket.on("connection", (ws, req) => {
        console.log("📡 ESP/Hub connected");

        ws.on("message", async (message) => {
            try {
                let data;
                try {
                    data = JSON.parse(message.toString());
                    console.log("Data From Hub => ", data)
                } catch {
                    console.log("❌ Invalid JSON");
                    return;
                }

                const {
                    hubId,
                    sensorName,
                    temperature,
                    humidity,
                } = data;

                // ================= VALIDATION =================
                if (!hubId || !sensorName) {
                    console.log("❌ hubId or sensorName missing");
                    return;
                }

                // 1️⃣ Validate Hub
                const hub = await HubModel.findById(hubId);
                if (!hub) {
                    console.log("❌ Hub not found:", hubId);
                    return;
                }

                // 2️⃣ Validate Sensor belongs to Hub
                const sensor = await SensorModel.findOne({
                    hubId: hub._id,
                    sensorName,
                });

                if (!sensor) {
                    console.log(
                        `❌ Sensor "${sensorName}" not linked to hub ${hub.name}`
                    );
                    return;
                }

                // 3️⃣ Find Rack containing this sensor
                const rack = await RackModel.findOne({
                    "hub.id": hub._id,
                    "sensors._id": sensor._id,
                });

                if (!rack) {
                    console.log("❌ Rack not found for sensor");
                    return;
                }

                // ================= CONDITION CHECK =================
                let tempA = false;
                let humiA = false;

                rack.conditions.forEach((condition) => {
                    if (condition.type === "temp") {
                        if (
                            (condition.operator === ">" &&
                                temperature > condition.value) ||
                            (condition.operator === "<" &&
                                temperature < condition.value)
                        ) {
                            tempA = true;
                        }
                    }

                    if (condition.type === "humidity") {
                        if (
                            (condition.operator === ">" &&
                                humidity > condition.value) ||
                            (condition.operator === "<" &&
                                humidity < condition.value)
                        ) {
                            humiA = true;
                        }
                    }
                });

                // ================= UPDATE RACK =================
                rack.tempA = tempA;
                rack.humiA = humiA;
                rack.tempV = temperature;
                rack.humiV = humidity;

                await rack.save();

                console.log("✅ Rack Updated:", {
                    rack: rack.name,
                    tempA,
                    humiA,
                    tempV: temperature,
                    humiV: humidity,
                });

                // Optional response to ESP
                ws.send(
                    JSON.stringify({
                        status: "ok",
                        rack: rack.name,
                        tempratureAlert: tempA,
                        humidityAlert: humiA,
                        tempratureValue: temperature,
                        humidityValue: humidity
                    })
                );
            } catch (error) {
                console.error("🔥 WebSocket processing error:", error.message);
            }
        });

        ws.on("close", () => {
            console.log("🔌 ESP disconnected");
        });

        ws.on("error", (err) => {
            console.error("❌ WebSocket error:", err.message);
        });
    });

    return wSocket;
};

module.exports = { espAlertSocket };
