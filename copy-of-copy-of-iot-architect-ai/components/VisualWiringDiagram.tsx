
import React, { useMemo } from 'react';
import { PinConnection, Platform, Language } from '../types';

interface VisualWiringDiagramProps {
  connections: PinConnection[];
  platform: Platform;
  language: Language;
}

const VisualWiringDiagram: React.FC<VisualWiringDiagramProps> = ({ connections, platform, language }) => {
  // 1. Group connections by component
  const componentGroups = useMemo(() => {
    const groups: { [key: string]: PinConnection[] } = {};
    connections.forEach(conn => {
      if (!groups[conn.component]) {
        groups[conn.component] = [];
      }
      groups[conn.component].push(conn);
    });
    return groups;
  }, [connections]);

  const components = Object.keys(componentGroups);
  const leftComponents = components.filter((_, i) => i % 2 === 0);
  const rightComponents = components.filter((_, i) => i % 2 !== 0);

  // 2. Configuration Constants (Larger and Spacier)
  const CANVAS_WIDTH = 1200; // Much wider
  const COMPONENT_WIDTH = 200;
  const HEADER_HEIGHT = 40; // Title bar height
  const PIN_ROW_HEIGHT = 30; // Height per pin row (prevents overlap)
  const COMPONENT_GAP = 50; // Gap between components
  const MCU_WIDTH = 260;
  const MIN_MCU_HEIGHT = 300;
  
  // 3. Calculate Layouts
  // Helper to get height of a single component based on pin count
  const getComponentHeight = (compName: string) => {
    const pinCount = componentGroups[compName].length;
    return HEADER_HEIGHT + (pinCount * PIN_ROW_HEIGHT) + 10;
  };

  // Calculate total height needed for left and right columns
  const leftTotalHeight = leftComponents.reduce((sum, name) => sum + getComponentHeight(name) + COMPONENT_GAP, 0);
  const rightTotalHeight = rightComponents.reduce((sum, name) => sum + getComponentHeight(name) + COMPONENT_GAP, 0);
  
  const CANVAS_HEIGHT = Math.max(MIN_MCU_HEIGHT + 100, Math.max(leftTotalHeight, rightTotalHeight) + 100);
  const CENTER_X = CANVAS_WIDTH / 2;
  const CENTER_Y = CANVAS_HEIGHT / 2;
  const MCU_HEIGHT = Math.max(MIN_MCU_HEIGHT, CANVAS_HEIGHT * 0.6); // MCU grows with canvas

  // 4. Pin Slot Allocation on MCU
  // We calculate total pins on left vs right to distribute MCU pads evenly
  const leftTotalPins = leftComponents.reduce((sum, name) => sum + componentGroups[name].length, 0);
  const rightTotalPins = rightComponents.reduce((sum, name) => sum + componentGroups[name].length, 0);

  // Helper to get MCU pin Y position
  const getMcuPinY = (sidePinIndex: number, totalSidePins: number, isRight: boolean) => {
    // Distribute pins along the side of the MCU
    const availableHeight = MCU_HEIGHT - 60; // Padding top/bottom
    const startY = (CENTER_Y - MCU_HEIGHT / 2) + 30;
    const step = availableHeight / Math.max(1, totalSidePins);
    // Center the spread if few pins
    if (totalSidePins < 5) {
        return CENTER_Y - ((totalSidePins - 1) * 40) / 2 + (sidePinIndex * 40);
    }
    return startY + (sidePinIndex * step) + (step/2);
  };

  // Track global pin index per side to assign slots
  let currentLeftPinIndex = 0;
  let currentRightPinIndex = 0;

  return (
    <div className="w-full overflow-x-auto bg-[#1a1f2e] border border-slate-700 rounded-xl shadow-inner mb-8">
      {/* Scrollable Container */}
      <div className="min-w-[1200px] flex justify-center p-8">
        <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="select-none font-mono">
          <defs>
            <filter id="glow-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="pcbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="metalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.3"/>
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* --- CENTRAL MCU --- */}
          <g transform={`translate(${CENTER_X - MCU_WIDTH / 2}, ${CENTER_Y - MCU_HEIGHT / 2})`}>
            {/* Chip Legs (Left) */}
            {Array.from({ length: Math.max(10, leftTotalPins) }).map((_, i) => (
               <rect key={`l-${i}`} x="-8" y={30 + i * ((MCU_HEIGHT-60)/Math.max(10, leftTotalPins))} width="12" height="6" fill="#94a3b8" />
            ))}
            {/* Chip Legs (Right) */}
            {Array.from({ length: Math.max(10, rightTotalPins) }).map((_, i) => (
               <rect key={`r-${i}`} x={MCU_WIDTH - 4} y={30 + i * ((MCU_HEIGHT-60)/Math.max(10, rightTotalPins))} width="12" height="6" fill="#94a3b8" />
            ))}

            {/* Main Body */}
            <rect 
                width={MCU_WIDTH} 
                height={MCU_HEIGHT} 
                rx="4" 
                fill="#334155" 
                stroke="#475569" 
                strokeWidth="2"
            />
            {/* Inner Black Chip */}
            <rect x="20" y="20" width={MCU_WIDTH - 40} height={MCU_HEIGHT - 40} rx="2" fill="#0f172a" stroke="#1e293b" />
            
            {/* Label */}
            <text x={MCU_WIDTH / 2} y={MCU_HEIGHT / 2} textAnchor="middle" fill="#e2e8f0" fontWeight="bold" fontSize="24" style={{textShadow: "0 0 10px rgba(99, 102, 241, 0.5)"}}>
              {platform}
            </text>
            <text x={MCU_WIDTH / 2} y={MCU_HEIGHT / 2 + 25} textAnchor="middle" fill="#64748b" fontSize="12" letterSpacing="2">
              {language === 'cn' ? "主控芯片" : "MICROCONTROLLER"}
            </text>
            
            {/* Decorative Gold Circle */}
            <circle cx="35" cy={MCU_HEIGHT - 35} r="6" fill="#eab308" opacity="0.8" />
          </g>

          {/* --- COMPONENTS & WIRING --- */}
          {components.map((compName, compIndex) => {
            const isLeft = compIndex % 2 === 0;
            const groupPins = componentGroups[compName];
            const compHeight = getComponentHeight(compName);
            
            // Calculate Y Position based on stack
            let startYOffset = 0;
            if (isLeft) {
                const prevComponents = leftComponents.slice(0, Math.floor(compIndex / 2));
                startYOffset = prevComponents.reduce((sum, n) => sum + getComponentHeight(n) + COMPONENT_GAP, 0);
            } else {
                const prevComponents = rightComponents.slice(0, Math.floor(compIndex / 2));
                startYOffset = prevComponents.reduce((sum, n) => sum + getComponentHeight(n) + COMPONENT_GAP, 0);
            }
            
            // Center the whole stack vertically
            const stackHeight = isLeft ? leftTotalHeight : rightTotalHeight;
            const stackStartY = CENTER_Y - (stackHeight / 2);
            const compY = stackStartY + startYOffset;
            const compX = isLeft ? 60 : CANVAS_WIDTH - 60 - COMPONENT_WIDTH;

            // X positions for wire connections
            const compPinX = isLeft ? compX + COMPONENT_WIDTH : compX;
            const mcuPinX = isLeft ? CENTER_X - MCU_WIDTH / 2 : CENTER_X + MCU_WIDTH / 2;

            return (
              <g key={compName}>
                {/* Component PCB Board */}
                <rect 
                    x={compX} 
                    y={compY} 
                    width={COMPONENT_WIDTH} 
                    height={compHeight} 
                    rx="6" 
                    fill="url(#pcbGradient)" 
                    stroke="#475569" 
                    strokeWidth="1"
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                />
                
                {/* Header / Title Area */}
                <path 
                    d={`M ${compX} ${compY+6} A 6 6 0 0 1 ${compX+6} ${compY} H ${compX+COMPONENT_WIDTH-6} A 6 6 0 0 1 ${compX+COMPONENT_WIDTH} ${compY+6} V ${compY+HEADER_HEIGHT} H ${compX} Z`} 
                    fill="#334155" 
                    opacity="0.5"
                />
                <text x={compX + 15} y={compY + 26} fill="#f8fafc" fontWeight="bold" fontSize="14">
                  {compName}
                </text>

                {/* Pins and Wires */}
                {groupPins.map((conn, pinIdx) => {
                  const pinRowY = compY + HEADER_HEIGHT + (pinIdx * PIN_ROW_HEIGHT) + (PIN_ROW_HEIGHT/2);
                  
                  // Calculate MCU Slot
                  const mcuSlotY = getMcuPinY(
                      isLeft ? currentLeftPinIndex : currentRightPinIndex, 
                      isLeft ? leftTotalPins : rightTotalPins,
                      !isLeft
                  );
                  
                  // Increment global counter
                  if (isLeft) currentLeftPinIndex++; else currentRightPinIndex++;

                  // Determine Color
                  let wireColor = "#94a3b8"; // Default slate
                  const name = conn.pin.toLowerCase();
                  if (name.includes('vcc') || name.includes('5v') || name.includes('3v3') || name.includes('+')) wireColor = "#ef4444"; // Red
                  else if (name.includes('gnd') || name.includes('-')) wireColor = "#64748b"; // Dark Grey (Black-ish)
                  else if (name.includes('sda') || name.includes('tx')) wireColor = "#eab308"; // Yellow
                  else if (name.includes('scl') || name.includes('rx')) wireColor = "#22c55e"; // Green
                  else if (name.includes('pwm')) wireColor = "#f97316"; // Orange
                  else wireColor = "#38bdf8"; // Blue

                  // Bezier Control Points
                  // Pull wires outward from component, then straight to MCU
                  const c1x = isLeft ? compPinX + 60 : compPinX - 60;
                  const c2x = isLeft ? mcuPinX - 80 : mcuPinX + 80;

                  return (
                    <g key={pinIdx}>
                      {/* 1. Wire */}
                      <path 
                        d={`M ${compPinX} ${pinRowY} C ${c1x} ${pinRowY}, ${c2x} ${mcuSlotY}, ${mcuPinX} ${mcuSlotY}`}
                        fill="none"
                        stroke={wireColor}
                        strokeWidth="3"
                        strokeOpacity="0.4"
                      />
                      {/* Wire Highlight (Core) */}
                      <path 
                        d={`M ${compPinX} ${pinRowY} C ${c1x} ${pinRowY}, ${c2x} ${mcuSlotY}, ${mcuPinX} ${mcuSlotY}`}
                        fill="none"
                        stroke={wireColor}
                        strokeWidth="1"
                        strokeOpacity="0.9"
                      />
                      
                      {/* Animated Current Dot */}
                      <circle r="2.5" fill="#fff">
                        <animateMotion 
                            dur={`${1.5 + (pinIdx * 0.2)}s`} 
                            repeatCount="indefinite"
                            path={`M ${compPinX} ${pinRowY} C ${c1x} ${pinRowY}, ${c2x} ${mcuSlotY}, ${mcuPinX} ${mcuSlotY}`}
                            keyPoints={isLeft ? "0;1" : "0;1"}
                            keyTimes="0;1"
                        />
                      </circle>

                      {/* 2. Component Pin Header Visual */}
                      <rect 
                        x={isLeft ? compPinX - 8 : compPinX} 
                        y={pinRowY - 4} 
                        width="8" 
                        height="8" 
                        fill="#000" 
                        stroke="#475569"
                      />
                      
                      {/* 3. Component Pin Label (Inside Box) */}
                      <text 
                        x={isLeft ? compPinX - 15 : compPinX + 15} 
                        y={pinRowY + 4} 
                        textAnchor={isLeft ? "end" : "start"} 
                        fill="#cbd5e1" 
                        fontSize="11" 
                      >
                        {conn.pin}
                      </text>

                      {/* 4. MCU Pin Label (Next to MCU Body) */}
                      <text 
                        x={isLeft ? mcuPinX - 10 : mcuPinX + 10} 
                        y={mcuSlotY + 4} 
                        textAnchor={isLeft ? "end" : "start"} 
                        fill="#e2e8f0" 
                        fontSize="11" 
                        fontWeight="bold"
                        fillOpacity="0.9"
                      >
                        {conn.targetPin}
                      </text>

                      {/* Connection Dot on MCU */}
                      <circle cx={mcuPinX} cy={mcuSlotY} r="3" fill="#cbd5e1" />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default VisualWiringDiagram;
