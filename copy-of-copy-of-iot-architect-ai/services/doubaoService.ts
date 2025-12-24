
import { Platform, GeneratedResponse, Language, ChatMessage, ProjectData } from "../types";

// Doubao API configuration
const DOUBAO_API_BASE = "https://ark.cn-beijing.volces.com/api/v3";

interface DoubaoMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DoubaoRequest {
  model: string;
  messages: DoubaoMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}

const getSystemPrompt = (language: Language) => {
  return `
    Role: Senior Embedded Architect & Wokwi Simulation Specialist.
    Objective: Design a Professional IoT Solution.
    
    CRITICAL RULE: STRICT SEPARATION OF REALITY AND SIMULATION.

    1. **BOM ('hardwareList') & Connections ('connections')**:
       - MUST list the **REAL HIGH-END HARDWARE** (e.g., 'Industrial RS485 pH Sensor', 'AI Camera Module').
       - **wokwiComponent Field**: For each item, provide the **EXACT WOKWI SEARCH TERM**.
         - If the real part exists (e.g., Servo, DHT22), use it.
         - If the real part DOES NOT exist (e.g., Camera, Water Sensor), use a **MOCK** like 'Potentiometer', 'Pushbutton', or 'Slide Switch'.
         - Examples:
           - "AI Camera" -> wokwiComponent: "Pushbutton" (Simulate Face Detect trigger)
           - "Water Quality Sensor" -> wokwiComponent: "Potentiometer" (Simulate analog reading)
           - "Motor Driver" -> wokwiComponent: "LED" (Simulate Output)
           - "Servo" -> wokwiComponent: "Servo"
           - "OLED" -> wokwiComponent: "SSD1306"

    2. **Wokwi Simulation Config ('diagram.json')**:
       - **MANDATORY**: Include "wokwi-esp32-devkit-v1" with id "esp" (top:0, left:0).
       - **Allowed Parts Only** (Use these exact types):
         - 'wokwi-servo' (id: 'servo1', 'servo2'...)
         - 'wokwi-led' (id: 'led1'...)
         - 'wokwi-pushbutton' (id: 'btn1'...)
         - 'wokwi-slide-switch' (id: 'sw1'...)
         - 'wokwi-potentiometer' (id: 'pot1'...)
         - 'board-ssd1306' (id: 'oled1') -> Use I2C.
         - 'wokwi-dht22' (id: 'dht1')
         - 'wokwi-buzzer' (id: 'buzzer1')
       - **WIRING RULES (CRITICAL)**:
         - EVERY component MUST have VCC (Red) and GND (Black) connected.
         - DO NOT leave components floating.
         - Servo: "V+" -> "esp:VIN", "GND" -> "esp:GND.1", "PWM" -> "esp:D..."
         - OLED: "VCC" -> "esp:3V3", "GND" -> "esp:GND.1", "SDA" -> "esp:21", "SCL" -> "esp:22"
         - LED: "A" -> "esp:D...", "C" -> "esp:GND.1"
         - Button: "1.r" -> "esp:GND.1", "2.l" -> "esp:D..." (Use INPUT_PULLUP in code)
         - Potentiometer: "GND"->"esp:GND.1", "VCC"->"esp:3V3", "SIG"->"esp:34" (ADC)
       - **Pin IDs**: Use "D2", "D4", "D5", "D12", "D13", "D14", "D15", "D18", "D19", "D21", "D22", "D23", "D25", "D26", "D27", "D32", "D33", "VIN", "GND.1", "3V3".
       
    3. **Firmware ('sketch.ino' + 'libraries.txt')**:
       - **libraries.txt**: MUST list EXACT OFFICIAL LIBRARY NAMES from Arduino Library Manager (case-sensitive).
         - CORRECT: "ESP32Servo" (NOT ESP32Servo.h)
         - CORRECT: "Adafruit GFX Library" (NOT Adafruit_GFX)
         - CORRECT: "Adafruit SSD1306" (NOT Adafruit_SSD1306)
         - CORRECT: "DHT sensor library"
       - **sketch.ino**: 
         - '#define' pins MUST match 'diagram.json' connections exactly.
         - If using OLED, include:
           #include <Wire.h>
           #include <Adafruit_GFX.h>
           #include <Adafruit_SSD1306.h>
         - If using Servo, include <ESP32Servo.h> and attach correctly.

    4. **Logic Architecture ('logicStates')**:
       - Return a STRUCTURED JSON ARRAY of states.
       - Example: State: "Idle", Description: "Waiting...", Transitions: [{target: "Active", condition: "Button"}]

    Output Format: JSON with the following structure:
    {
      "isPossible": boolean,
      "impossibilityReason": string (if isPossible is false),
      "project": {
        "projectName": string,
        "description": string,
        "explanation": string,
        "hardwareList": [...],
        "substitutions": [...],
        "connections": [...],
        "logicStates": [...],
        "files": [...]
      }
    }
  `;
};

export const generateEmbeddedProjectWithDoubao = async (
  platform: Platform,
  userPrompt: string,
  language: Language
): Promise<GeneratedResponse> => {
  const apiKey = process.env.DOUBAO_API_KEY;
  
  if (!apiKey) {
    throw new Error("DOUBAO_API_KEY is not set in environment variables");
  }

  const userContent = `
    Platform: ${platform}
    Language: ${language}
    Request: ${userPrompt}
    
    Instructions:
    1. If the request is nonsensical or impossible, set 'isPossible' to false.
    2. Otherwise, generate the full project structure.
    3. Ensure 'diagram.json' parts have logical positions (top/left) so they don't overlap.
    4. ENSURE ALL PARTS ARE WIRED.
  `;

  const messages: DoubaoMessage[] = [
    {
      role: "system",
      content: getSystemPrompt(language)
    },
    {
      role: "user",
      content: userContent
    }
  ];

  const requestBody: DoubaoRequest = {
    model: "doubao-pro-32k",
    messages: messages,
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: "json_object" }
  };

  try {
    const response = await fetch(`${DOUBAO_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Doubao API error:", errorText);
      throw new Error(`Doubao API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from Doubao AI");
    }

    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content) as GeneratedResponse;
    } catch (e) {
      console.error("Failed to parse Doubao response:", e);
      throw new Error("Failed to parse AI response");
    }
  } catch (error) {
    console.error("Error calling Doubao API:", error);
    throw error;
  }
};

export const chatWithArchitectDoubao = async (
  project: ProjectData,
  history: ChatMessage[],
  newMessage: string,
  language: Language
): Promise<string> => {
  const apiKey = process.env.DOUBAO_API_KEY;
  
  if (!apiKey) {
    throw new Error("DOUBAO_API_KEY is not set in environment variables");
  }

  const systemPrompt = `You are the AI Architect who designed this embedded project.
  Project: ${project.projectName}
  Description: ${project.description}
  Language: ${language} (Reply in this language)
  
  Your goal is to answer the user's questions about the hardware selection, code logic, or wiring.
  Be concise, professional, and helpful.`;

  const messages: DoubaoMessage[] = [
    {
      role: "system",
      content: systemPrompt
    },
    ...history.map(msg => ({
      role: msg.role === "user" ? "user" as const : "assistant" as const,
      content: msg.content
    })),
    {
      role: "user",
      content: newMessage
    }
  ];

  const requestBody: DoubaoRequest = {
    model: "doubao-pro-32k",
    messages: messages,
    temperature: 0.7,
    max_tokens: 2048
  };

  try {
    const response = await fetch(`${DOUBAO_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Doubao API error:", errorText);
      throw new Error(`Doubao API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from Doubao AI");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling Doubao API:", error);
    throw error;
  }
};
