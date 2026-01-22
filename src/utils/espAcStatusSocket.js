// const WebSocket = require("ws");

// let esp32Clients = new Map(); // clusterId -> ws

// const espAcStatusSocket = (server) => {
//     const wss = new WebSocket.Server({ noServer: true });

//     console.log("ESP32 AC WebSocket Server initialized");

//     wss.on("connection", (ws) => {
//         console.log("ESP32 connected (AC Control)");

//         ws.on("message", (message) => {
//             try {
//                 const data = JSON.parse(message.toString());

//                 if (data.type === "REGISTER" && data.clusterId) {
//                     esp32Clients.set(data.clusterId.toString(), ws);
//                     ws.clusterId = data.clusterId;

//                     console.log(`ESP32 registered for cluster ${data.clusterId}`);
//                 }
//             } catch (err) {
//                 console.error("Invalid WS message", err.message);
//             }
//         });


//         ws.on("close", () => {
//             if (ws.clusterId) {
//                 esp32Clients.delete(ws.clusterId.toString());
//                 console.log(`ESP32 disconnected from cluster ${ws.clusterId}`);
//             }
//         });
//     });

//     return wss;
// };


// /**
//  * 🔌 Send AC Control to ESP32
//  * @param {String} clusterId
//  * @param {Boolean} ackitStatus
//  * @param {Number} meanTemp
//  */
// const sendAcStatusToEsp32 = (clusterId, ackitStatus, meanTemp) => {
//     const ws = esp32Clients.get(clusterId.toString());

//     if (!ws || ws.readyState !== WebSocket.OPEN) {
//         console.log("ESP32 not connected for cluster:", clusterId);
//         return;
//     }

//     const payload = {
//         type: "AC_CONTROL",
//         ac: ackitStatus ? 1 : 0,
//         meanTemp,
//     };

//     ws.send(JSON.stringify(payload));
//     console.log("Sent to ESP32:", payload);
// };

// module.exports = {
//     espAcStatusSocket,
//     sendAcStatusToEsp32,
// };


const WebSocket = require("ws");
const RackClusterModel = require("../models/rackClusterModel");

let esp32Clients = new Map(); // clusterId -> ws

const espAcStatusSocket = (server) => {
    const wss = new WebSocket.Server({ noServer: true });

    console.log("ESP32 AC WebSocket Server initialized");

    wss.on("connection", (ws) => {
        console.log("ESP32 connected (AC Control)");

        ws.on("message", async (message) => {
            try {
                const data = JSON.parse(message.toString());

                // 🔹 ESP32 REGISTRATION
                if (data.type === "REGISTER" && data.clusterId) {
                    esp32Clients.set(data.clusterId.toString(), ws);
                    ws.clusterId = data.clusterId;

                    console.log(`✅ ESP32 registered for cluster ${data.clusterId}`);
                    return;
                }

                // 🔹 ESP32 ACK RESPONSE
                if (data.type === "AC_STATUS_ACK") {
                    console.log("📥 ACK received from ESP32");
                    console.log("Cluster:", data.clusterId);
                    console.log("AC Status:", data.ac === 1 ? "ON" : "OFF");
                    console.log("Status:", data.status);

                    // ✅ UPDATE DB BASED ON REAL DEVICE STATE
                    await RackClusterModel.updateOne(
                        { _id: data.clusterId },
                        {
                            ackitStatus: data.ac === 1,
                            lastAckAt: new Date(), // optional but recommended
                        }
                    );

                    console.log("✅ ackitStatus updated in DB");

                    return;
                }

                console.log("⚠️ Unknown message from ESP32:", data);
            } catch (err) {
                console.error("❌ Invalid WS message", err.message);
            }
        });


        ws.on("close", () => {
            if (ws.clusterId) {
                esp32Clients.delete(ws.clusterId.toString());
                console.log(`ESP32 disconnected from cluster ${ws.clusterId}`);
            }
        });
    });

    return wss;
};


/**
 * 🔌 Send AC Control to ESP32
 * @param {String} clusterId
 * @param {Boolean} ackitStatus
 * @param {Number} meanTemp
 */
const sendAcStatusToEsp32 = (clusterId, ackitStatus, meanTemp) => {
    const ws = esp32Clients.get(clusterId.toString());

    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log("ESP32 not connected for cluster:", clusterId);
        return;
    }

    const payload = {
        type: "AC_CONTROL",
        ac: ackitStatus ? 1 : 0,
        meanTemp,
    };

    ws.send(JSON.stringify(payload));
    console.log("Sent to ESP32:", payload);
};

module.exports = {
    espAcStatusSocket,
    sendAcStatusToEsp32,
};
