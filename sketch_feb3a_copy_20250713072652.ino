#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Pin definitions untuk ESP32-C3
const int sensorPin = 4;        // Pin ADC yang tersedia di ESP32-C3 (GPIO4)
const int buzzerPin = 8;        // Pin digital untuk buzzer (GPIO8)
const int ledPin = 10;          // Pin LED indikator (GPIO10)

#define SERVICE_UUID        "0000ffe0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "0000ffe1-0000-1000-8000-00805f9b34fb"

BLECharacteristic *pCharacteristic;
BLEServer *pServer = nullptr;
bool deviceConnected = false;

// Microsleep detection variables
bool isCurrentlyMicrosleep = false;
unsigned long microsleepStartTime = 0;
const unsigned long microsleepRequiredDuration = 3000; // 3 detik

bool alertSent = false;

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) override {
    deviceConnected = true;
    Serial.println("Device connected");
  }
  
  void onDisconnect(BLEServer *pServer) override {
    deviceConnected = false;
    Serial.println("Device disconnected");
    BLEDevice::startAdvertising();  // Pastikan BLE advertising dimulai ulang
  }
};

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Setup BLEp
  BLEDevice::init("FocusView");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_NOTIFY
                    );

  pCharacteristic->addDescriptor(new BLE2902());

  pService->start();

  // Advertising setup agar nama bisa discan
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising(); // Mulai advertising pertama kali

  // Pin setup
  pinMode(sensorPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);
  digitalWrite(ledPin, LOW);

  Serial.println("ESP32-C3 BLE device is ready");
  Serial.println("Pin configuration:");
  Serial.println("- Sensor Pin: GPIO4");
  Serial.println("- Buzzer Pin: GPIO8");
  Serial.println("- LED Pin: GPIO10");
}

void activateBuzzer() {
  digitalWrite(buzzerPin, HIGH);
  digitalWrite(ledPin, HIGH);
}

void deactivateBuzzer() {
  digitalWrite(buzzerPin, LOW);
  digitalWrite(ledPin, LOW);
}

void sendBLENotification(const char* message) {
  if (deviceConnected) {
    pCharacteristic->setValue(message);
    pCharacteristic->notify();
  }
}

void loop() {
  int sensorValue = analogRead(sensorPin);
  bool isMicrosleep = sensorValue < 1000;
  
  unsigned long now = millis();

  if (isMicrosleep) {
    if (!isCurrentlyMicrosleep) {
      microsleepStartTime = now;
      isCurrentlyMicrosleep = true;
      alertSent = false;
    } else if (now - microsleepStartTime >= microsleepRequiredDuration && !alertSent) {
      sendBLENotification("microsleep");
      activateBuzzer();
      alertSent = true;
      Serial.println("Microsleep detected! Buzzer ON");
    }
  } else {
    if (isCurrentlyMicrosleep || alertSent) {
      isCurrentlyMicrosleep = false;
      deactivateBuzzer();
      alertSent = false;
      sendBLENotification("normal");
      Serial.println("Sensor normal, buzzer OFF");
    }
  }

  Serial.print("Sensor nilai: ");
  Serial.println(sensorValue);

  delay(100);
}
