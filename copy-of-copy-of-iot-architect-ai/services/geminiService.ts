
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, GeneratedResponse, Language, ChatMessage, ProjectData } from "../types";

const getSchema = () => {
  return {
    type: Type.OBJECT,
    properties: {
      isPossible: { type: Type.BOOLEAN },
      impossibilityReason: { type: Type.STRING },
      project: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          description: { type: Type.STRING },
          explanation: { type: Type.STRING },
          hardwareList: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      count: { type: Type.NUMBER },
                      reason: { type: Type.STRING },
                      wokwiComponent: { type: Type.STRING, description: "Exact name to search in Wokwi (e.g. 'DHT22', 'Servo', 'Pushbutton')" }
                  }
              }
          },
          substitutions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING },
                    replacement: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["original", "replacement", "description"]
            }
          },
          connections: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      component: { type: Type.STRING },
                      pin: { type: Type.STRING },
                      targetPin: { type: Type.STRING },
                      comment: { type: Type.STRING }
                  }
              }
          },
          // New Structured Logic Format
          logicStates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                state: { type: Type.STRING, description: "Short name of the state (e.g. 'Idle', 'Detecting')" },
                description: { type: Type.STRING, description: "What happens in this state (e.g. 'Waiting for button press')" },
                transitions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      target: { type: Type.STRING, description: "Name of the next state" },
                      condition: { type: Type.STRING, description: "Condition to switch (e.g. 'Button Pressed')" }
                    }
                  }
                }
              },
              required: ["state", "description", "transitions"]
            }
          },
          flowchart: { type: Type.STRING, description: "Optional simple summary" },
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                path: { type: Type.STRING },
                content: { type: Type.STRING },
                language: { type: Type.STRING }
              },
              required: ["path", "content", "language"]
            }
          }
        },
        required: ["projectName", "hardwareList", "connections", "files", "logicStates", "explanation", "substitutions"]
      }
    },
    required: ["isPossible"]
  };
};

export const generateEmbeddedProject = async (
  platform: Platform,
  userPrompt: string,
  language: Language
): Promise<GeneratedResponse> => {
  const model = "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Optimized System Prompt with Strict Wokwi & Logic Standards
  const systemInstruction = `
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

    Output Format: JSON.
  `;

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

  const response = await ai.models.generateContent({
    model: model,
    config: {
        responseMimeType: "application/json",
        responseSchema: getSchema(),
        systemInstruction: systemInstruction,
    },
    contents: [
      { role: "user", parts: [{ text: userContent }] }
    ]
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  try {
    return JSON.parse(text) as GeneratedResponse;
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    throw new Error("Failed to generate project");
  }
};

export const chatWithArchitect = async (
  project: ProjectData,
  history: ChatMessage[],
  newMessage: string,
  language: Language
): Promise<string> => {
  const model = "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: `You are the AI Architect who designed this embedded project.
      Project: ${project.projectName}
      Description: ${project.description}
      Language: ${language} (Reply in this language)
      
      Your goal is to answer the user's questions about the hardware selection, code logic, or wiring.
      Be concise, professional, and helpful.`,
    },
    history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }))
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text;
};
