#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ================= WIFI CONFIG =================
const char* ssid = "FaRaZ";
const char* password = "faraz32729";

// ================= SERVER CONFIG =================
const char* websocket_host = "10.140.74.154";  // 🔴 Node.js server IP
const uint16_t websocket_port = 5053;
const char* websocket_path = "/ws/ac-control";

// ================= DEVICE CONFIG =================
const char* CLUSTER_ID = "69720d62ff2065350a5115d1";  // 🔴 Your clusterId

// ================= AC RELAY PIN =================
#define AC_RELAY_PIN 26  // change pin if needed

WebSocketsClient webSocket;

// ================= HANDLE SOCKET EVENTS =================
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {

    case WStype_CONNECTED:
      Serial.println("✅ Connected to WebSocket server");

      // REGISTER MESSAGE
      {
        StaticJsonDocument<200> doc;
        doc["type"] = "REGISTER";
        doc["clusterId"] = CLUSTER_ID;

        String message;
        serializeJson(doc, message);
        webSocket.sendTXT(message);

        Serial.println("📨 Sent REGISTER message:");
        Serial.println(message);
      }
      break;

    case WStype_DISCONNECTED:
      Serial.println("❌ Disconnected from WebSocket server");
      break;

    case WStype_TEXT:
      Serial.print("📩 Message from server: ");
      Serial.println((char*)payload);

      handleServerMessage((char*)payload);
      break;

    default:
      break;
  }
}

// ================= HANDLE SERVER MESSAGE =================
void handleServerMessage(const char* message) {
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.println("❌ Failed to parse JSON");
    return;
  }

  const char* type = doc["type"];

  // if (strcmp(type, "AC_CONTROL") == 0) {
  //   int acStatus = doc["ac"];  // 1 or 0
  //   float meanTemp = doc["meanTemp"];

  //   Serial.println("⚡ AC CONTROL RECEIVED");
  //   Serial.print("AC Status: ");
  //   Serial.println(acStatus == 1 ? "ON" : "OFF");

  //   Serial.print("Mean Temperature: ");
  //   Serial.println(meanTemp);

  //   // CONTROL RELAY
  //   digitalWrite(AC_RELAY_PIN, acStatus == 1 ? HIGH : LOW);
  // }
  if (strcmp(type, "AC_CONTROL") == 0) {
    int acStatus = doc["ac"];  // 1 or 0
    float meanTemp = doc["meanTemp"];

    Serial.println("⚡ AC CONTROL RECEIVED");
    Serial.print("AC Status: ");
    Serial.println(acStatus == 1 ? "ON" : "OFF");

    Serial.print("Mean Temperature: ");
    Serial.println(meanTemp);

    // CONTROL RELAY
    digitalWrite(AC_RELAY_PIN, acStatus == 1 ? HIGH : LOW);

    // ✅ SEND SUCCESS ACK BACK TO SERVER
    sendAckToServer(acStatus);
  }
}




void sendAckToServer(int acStatus) {
  StaticJsonDocument<200> doc;
  doc["type"] = "AC_STATUS_ACK";
  doc["clusterId"] = CLUSTER_ID;
  doc["ac"] = acStatus;
  doc["status"] = "APPLIED";

  String message;
  serializeJson(doc, message);

  webSocket.sendTXT(message);

  Serial.println("📤 ACK sent to server:");
  Serial.println(message);
}


// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(AC_RELAY_PIN, OUTPUT);
  digitalWrite(AC_RELAY_PIN, LOW);  // AC OFF by default

  // WIFI CONNECT
  Serial.println("📡 Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✅ WiFi connected");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());

  // WEBSOCKET INIT
  webSocket.begin(websocket_host, websocket_port, websocket_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

// ================= LOOP =================
void loop() {
  webSocket.loop();
}
