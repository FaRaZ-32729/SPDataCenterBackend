#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ================= WIFI CONFIG =================
const char* ssid = "FaRaZ";
const char* password = "faraz32729";

// ================= SERVER CONFIG =================
const char* websocket_host = "10.140.74.154";   // 🔴 Node.js IP
const uint16_t websocket_port = 5053;
const char* websocket_path = "/ws/alerts";

// ================= HUB CONFIG =================
const char* HUB_ID = "696a3fd213d499c0f40ef98d";

// ================= SENSOR CONFIG =================
#define TOTAL_SENSORS 15
#define MIN_SEND 4
#define MAX_SEND 5
#define INTERVAL_MS 60000  // 1 minute

WebSocketsClient webSocket;
unsigned long lastSendTime = 0;

// ================= SENSOR LIST =================
String sensors[TOTAL_SENSORS];

// ================= UTIL FUNCTIONS =================
float getRandomTemp() {
    return random(2000, 4000) / 100.0;   // 20–40°C
}

float getRandomHumidity() {
    return random(3000, 8000) / 100.0;   // 30–80%
}

// Fisher–Yates Shuffle
void shuffleSensors() {
    for (int i = TOTAL_SENSORS - 1; i > 0; i--) {
        int j = random(0, i + 1);
        String temp = sensors[i];
        sensors[i] = sensors[j];
        sensors[j] = temp;
    }
}

// ================= SOCKET EVENTS =================
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {

        case WStype_CONNECTED:
            Serial.println("✅ Connected to backend (alerts)");
            break;

        case WStype_DISCONNECTED:
            Serial.println("❌ Disconnected from backend");
            break;

        case WStype_ERROR:
            Serial.println("❌ WebSocket error");
            break;

        default:
            break;
    }
}

// ================= SETUP =================
void setup() {
    Serial.begin(115200);
    delay(1000);

    randomSeed(esp_random());

    // Initialize sensor names
    for (int i = 0; i < TOTAL_SENSORS; i++) {
        sensors[i] = "S-" + String(i + 1);
    }

    // WiFi
    Serial.print("📡 Connecting to WiFi");
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\n✅ WiFi connected");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());

    // WebSocket
    webSocket.begin(websocket_host, websocket_port, websocket_path);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
}

// ================= LOOP =================
void loop() {
    webSocket.loop();

    unsigned long now = millis();

    if (now - lastSendTime >= INTERVAL_MS) {
        lastSendTime = now;

        // Shuffle sensors
        shuffleSensors();

        // Decide how many sensors to send (4 or 5)
        int sendCount = random(MIN_SEND, MAX_SEND + 1);

        Serial.println("\n⏱️ Sending sensor batch...");
        Serial.print("Sensors this minute: ");
        Serial.println(sendCount);

        for (int i = 0; i < sendCount; i++) {
            StaticJsonDocument<256> doc;

            doc["hubId"] = HUB_ID;
            doc["sensorName"] = sensors[i];
            doc["temperature"] = getRandomTemp();
            doc["humidity"] = getRandomHumidity();
            doc["timestamp"] = millis();

            String message;
            serializeJson(doc, message);

            webSocket.sendTXT(message);

            Serial.print("📤 Sent → ");
            Serial.println(message);
        }
    }
}
