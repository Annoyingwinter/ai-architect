
export enum Platform {
  ESP32 = 'ESP32',
  STM32 = 'STM32',
}

export type Language = 'cn' | 'en';

export interface FileNode {
  path: string;
  content: string;
  language: string;
}

export interface HardwareComponent {
  name: string;
  description: string;
  count: number;
  reason: string; // Why this component was chosen
  wokwiComponent?: string; // Exact name to search in Wokwi
}

export interface PinConnection {
  component: string;
  pin: string;
  targetPin: string; // e.g., "GPIO 4" or "PA5"
  comment?: string;
}

export interface Substitution {
  original: string;
  replacement: string;
  description: string;
}

export interface LogicState {
  state: string;
  description: string;
  transitions: {
    target: string;
    condition: string;
  }[];
}

export interface ProjectData {
  projectName: string;
  description: string;
  hardwareList: HardwareComponent[]; // List of parts to buy
  connections: PinConnection[];     // How to wire them
  files: FileNode[];
  flowchart: string; // Deprecated, kept for backward compat but usually empty now
  logicStates: LogicState[]; // New robust JSON logic
  explanation: string;
  substitutions: Substitution[];
}

export interface GeneratedResponse {
  isPossible: boolean;
  impossibilityReason?: string;
  project?: ProjectData;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
