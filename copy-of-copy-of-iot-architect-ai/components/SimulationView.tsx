
import React, { useState } from 'react';
import { ProjectData, Language, Platform } from '../types';
import { CopyIcon, ChipIcon, CheckCircleIcon, ArrowRightIcon, RefreshIcon, BrainIcon, MinimizeIcon, WrenchIcon, FileCodeIcon } from './Icons';

interface SimulationViewProps {
  project: ProjectData;
  language: Language;
  platform: Platform;
}

const SimulationView: React.FC<SimulationViewProps> = ({ project, language, platform }) => {
  const [simUrl, setSimUrl] = useState("https://wokwi.com/projects/new/esp32");
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('manual'); // Default to manual per user request
  
  const [copiedDiag, setCopiedDiag] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLibs, setCopiedLibs] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const t = {
    title: language === 'cn' ? "仿真实验室" : "Sim Lab",
    openPanel: language === 'cn' ? "打开控制台" : "Open Controls",
    closePanel: language === 'cn' ? "收起" : "Minimize",
    subtitle: language === 'cn' ? "虚拟硬件环境" : "Virtual Environment",
    
    tabAuto: language === 'cn' ? "自动配置" : "Auto Config",
    tabManual: language === 'cn' ? "手动连线指南" : "Manual Guide",

    config: language === 'cn' ? "1. 粘贴配置 (diagram.json)" : "1. Paste Config (diagram.json)",
    libs: language === 'cn' ? "2. 粘贴库 (libraries.txt)" : "2. Paste Libs (libraries.txt)",
    code: language === 'cn' ? "3. 粘贴代码 (sketch.ino)" : "3. Paste Code (sketch.ino)",
    copy: language === 'cn' ? "复制" : "Copy",
    copied: language === 'cn' ? "成功" : "Copied",
    run: language === 'cn' ? "在仿真器中运行 ▶" : "Run in Simulator ▶",
    noDiagram: language === 'cn' ? "未生成仿真数据" : "No simulation data",
    mockTitle: language === 'cn' ? "仿真替换表" : "Substitutions",
    
    manualParts: language === 'cn' ? "第一步: 添加元器件" : "Step 1: Add Parts",
    manualWiring: language === 'cn' ? "第二步: 连线表" : "Step 2: Wiring",
    manualLibs: language === 'cn' ? "第三步: 安装库" : "Step 3: Install Libraries",
    
    debugTitle: language === 'cn' ? "生成逻辑解密" : "Generator Logic Decoded",
    howItWorks: language === 'cn' ? "逻辑解密" : "Logic Decoded",
    
    searchWokwi: language === 'cn' ? "Wokwi 搜索名称" : "Search in Wokwi",
    realPart: language === 'cn' ? "真实组件" : "Real Module"
  };

  const diagramFile = project.files.find(f => f.path === 'diagram.json');
  const codeFile = project.files.find(f => f.path.endsWith('.ino') || f.path.endsWith('.cpp') || f.path.endsWith('.c'));
  const libFile = project.files.find(f => f.path === 'libraries.txt');

  const handleCopyDiagram = () => {
    if (diagramFile) {
      try {
        const jsonObj = JSON.parse(diagramFile.content);
        
        // STRICT WOKWI SANITIZATION
        const wokwiJson = {
            "version": 1,
            "editor": "wokwi",
            "author": "AI Architect",
            "parts": jsonObj.parts || [],
            "connections": jsonObj.connections || [],
            "dependencies": jsonObj.dependencies || {}
        };

        // Ensure 'esp' exists
        const hasEsp = wokwiJson.parts.some((p: any) => p.id === 'esp');
        if (!hasEsp) {
            wokwiJson.parts.unshift({
                "type": "wokwi-esp32-devkit-v1",
                "id": "esp",
                "top": 0,
                "left": 0,
                "attrs": {}
            });
        }

        const formatted = JSON.stringify(wokwiJson, null, 2);
        navigator.clipboard.writeText(formatted);
      } catch (e) {
        navigator.clipboard.writeText(diagramFile.content);
      }
      setCopiedDiag(true);
      setTimeout(() => setCopiedDiag(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (codeFile) {
      navigator.clipboard.writeText(codeFile.content);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLibs = () => {
    if (libFile) {
      const cleanContent = libFile.content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('//'))
        .join('\n');

      navigator.clipboard.writeText(cleanContent);
      setCopiedLibs(true);
      setTimeout(() => setCopiedLibs(false), 2000);
    }
  };

  const simulators = [
      { name: "ESP32 DevKit V1", url: "https://wokwi.com/projects/new/esp32" },
      { name: "ESP32-S3", url: "https://wokwi.com/projects/new/esp32-s3" },
      { name: "STM32 Nucleo", url: "https://wokwi.com/projects/new/stm32" },
      { name: "Arduino Uno", url: "https://wokwi.com/projects/new/arduino-uno" },
      { name: "Pi Pico", url: "https://wokwi.com/projects/new/pi-pico" },
  ];

  if (!diagramFile) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-[#1e1e1e]">
              <ChipIcon className="w-16 h-16 mb-4 opacity-20" />
              <p>{t.noDiagram}</p>
          </div>
      );
  }

  // Parse for Manual Mode
  // We prefer the AI's explicit 'wokwiComponent' map if available, otherwise fallback to parts
  const manualLibs = libFile ? libFile.content.split('\n').filter(l => l.trim().length > 0 && !l.startsWith('//')) : [];

  return (
    <div className="relative w-full h-full bg-[#1e1e1e] overflow-hidden group">
        
        {/* Full Screen Iframe */}
        <div className="absolute inset-0 z-0">
             <iframe 
                key={simUrl} 
                src={simUrl}
                className="w-full h-full border-none block"
                title="Wokwi Simulator"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
            />
        </div>

        {/* Floating Control Dock */}
        <div className={`absolute top-4 left-4 bottom-4 w-80 flex flex-col transition-transform duration-300 z-10 ${isPanelOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
            <div className="flex-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <ChipIcon className="w-5 h-5" />
                            <div>
                                <h2 className="font-bold text-sm text-slate-200">{t.title}</h2>
                                <p className="text-[10px] text-slate-500 font-medium">{t.subtitle}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsPanelOpen(false)}
                            className="text-slate-500 hover:text-white transition-colors"
                            title={t.closePanel}
                        >
                            <MinimizeIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex bg-slate-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${activeTab === 'manual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {t.tabManual}
                        </button>
                        <button 
                            onClick={() => setActiveTab('auto')}
                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${activeTab === 'auto' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {t.tabAuto}
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    
                    {/* Platform Selector */}
                    <div>
                        <select 
                            value={simUrl}
                            onChange={(e) => setSimUrl(e.target.value)}
                            className="w-full bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                            {simulators.map(s => <option key={s.url} value={s.url}>{s.name}</option>)}
                        </select>
                    </div>

                    {activeTab === 'manual' ? (
                        /* --- MANUAL MODE UI --- */
                        <div className="space-y-6">
                            
                            {/* Step 1: Parts (Enhanced Mapping) */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide border-b border-slate-800 pb-1">
                                    {t.manualParts}
                                </h4>
                                <div className="space-y-1">
                                    {project.hardwareList.filter(h => h.wokwiComponent).length > 0 ? (
                                        // Use Explicit Mapping from hardwareList
                                        project.hardwareList.filter(h => h.wokwiComponent).map((part, i) => (
                                            <div key={i} className="flex items-center justify-between bg-slate-800/50 px-2 py-1.5 rounded border border-slate-700/50">
                                                <span className="text-[11px] text-slate-300 font-medium truncate max-w-[50%]">{part.name}</span>
                                                <div className="flex items-center gap-1">
                                                    <ArrowRightIcon className="w-3 h-3 text-slate-600" />
                                                    <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 rounded font-mono border border-yellow-500/20">{part.wokwiComponent}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        // Fallback to diagram parts
                                        <p className="text-[10px] text-slate-500 italic">No specific mappings found. Check JSON.</p>
                                    )}
                                    <p className="text-[9px] text-slate-500 mt-1">
                                        Click <strong className="text-slate-300">+</strong> in Wokwi and search exactly for the yellow names above.
                                    </p>
                                </div>
                            </div>

                            {/* Step 2: Wiring */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide border-b border-slate-800 pb-1">
                                    {t.manualWiring}
                                </h4>
                                <div className="space-y-1">
                                    {project.connections.map((conn, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[11px] bg-slate-800/50 px-2 py-1.5 rounded border border-slate-700/50">
                                            <span className="text-slate-300 font-semibold">{conn.component}</span>
                                            <span className="text-slate-500">:</span>
                                            <span className="text-yellow-400 font-mono">{conn.pin}</span>
                                            <ArrowRightIcon className="w-3 h-3 text-slate-600" />
                                            <span className="text-blue-400 font-mono font-bold">ESP:{conn.targetPin}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step 3: Libraries */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide border-b border-slate-800 pb-1">
                                    {t.manualLibs}
                                </h4>
                                <div className="space-y-1">
                                    {manualLibs.length === 0 ? (
                                        <p className="text-[10px] text-slate-500 italic">No libraries needed.</p>
                                    ) : (
                                        manualLibs.map((lib, i) => (
                                            <div key={i} className="flex items-center justify-between bg-slate-800/50 px-2 py-1.5 rounded border border-slate-700/50">
                                                <span className="text-[11px] text-purple-300 font-mono truncate">{lib}</span>
                                            </div>
                                        ))
                                    )}
                                    <p className="text-[9px] text-slate-500 mt-1">
                                        Click <strong className="text-slate-300">Library Manager</strong> tab and <strong className="text-slate-300">+</strong> to search & add these exact names.
                                    </p>
                                </div>
                            </div>

                            {/* Code Copy Button (Always useful) */}
                             <div className="pt-2 border-t border-slate-800">
                                <button 
                                    onClick={handleCopyCode}
                                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all border ${
                                        copiedCode 
                                        ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <FileCodeIcon className="w-4 h-4" />
                                        {t.code}
                                    </span>
                                    {copiedCode ? <CheckCircleIcon className="w-4 h-4" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                </button>
                             </div>

                        </div>
                    ) : (
                        /* --- AUTO CONFIG UI (Old Way) --- */
                        <div className="space-y-3">
                             <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-200 leading-relaxed mb-2">
                                ⚠️ Switch to <strong>diagram.json</strong> tab in Wokwi before pasting config!
                             </div>

                            {/* Config */}
                            <div className="space-y-1">
                                 <div className="flex justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider pl-1">
                                    <span>{t.config}</span>
                                    <span className="text-blue-400">JSON</span>
                                 </div>
                                 <button 
                                    onClick={handleCopyDiagram}
                                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all border ${
                                        copiedDiag 
                                        ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                                        : 'bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-750 text-slate-300'
                                    }`}
                                >
                                    <span className="truncate flex-1 text-left">diagram.json</span>
                                    {copiedDiag ? <CheckCircleIcon className="w-4 h-4" /> : <CopyIcon className="w-3.5 h-3.5 opacity-70" />}
                                </button>
                            </div>

                            {/* Libs */}
                            {libFile && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider pl-1">
                                        <span>{t.libs}</span>
                                        <span className="text-purple-400">TXT</span>
                                    </div>
                                    <button 
                                        onClick={handleCopyLibs}
                                        className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all border ${
                                            copiedLibs 
                                            ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                                            : 'bg-slate-800 border-slate-700 hover:border-purple-500 hover:bg-slate-750 text-slate-300'
                                        }`}
                                    >
                                        <span className="truncate flex-1 text-left">libraries.txt</span>
                                        {copiedLibs ? <CheckCircleIcon className="w-4 h-4" /> : <CopyIcon className="w-3.5 h-3.5 opacity-70" />}
                                    </button>
                                </div>
                            )}

                            {/* Code */}
                            <div className="space-y-1">
                                 <div className="flex justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider pl-1">
                                    <span>{t.code}</span>
                                    <span className="text-yellow-400">C++</span>
                                 </div>
                                 <button 
                                    onClick={handleCopyCode}
                                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all border ${
                                        copiedCode 
                                        ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                                        : 'bg-slate-800 border-slate-700 hover:border-yellow-500 hover:bg-slate-750 text-slate-300'
                                    }`}
                                >
                                    <span className="truncate flex-1 text-left">sketch.ino</span>
                                    {copiedCode ? <CheckCircleIcon className="w-4 h-4" /> : <CopyIcon className="w-3.5 h-3.5 opacity-70" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-900 border-t border-slate-800">
                    <button 
                        onClick={() => setShowDebug(!showDebug)}
                        className="w-full text-center text-[10px] text-slate-500 hover:text-indigo-400 flex items-center justify-center gap-1.5 transition-colors py-1"
                    >
                        <BrainIcon className="w-3 h-3" /> {t.howItWorks}
                    </button>
                </div>
            </div>
        </div>

        {/* Minimized Button */}
        {!isPanelOpen && (
            <button 
                onClick={() => setIsPanelOpen(true)}
                className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur text-white p-3 rounded-xl shadow-lg border border-slate-700 hover:bg-indigo-600 hover:border-indigo-500 transition-all group"
                title={t.openPanel}
            >
                <ChipIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
        )}

        {/* Debug Modal Overlay */}
        {showDebug && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-8 backdrop-blur-sm animate-in fade-in">
             <div className="bg-[#1e293b] border border-indigo-500/30 rounded-2xl max-w-lg w-full shadow-2xl p-6 relative ring-1 ring-indigo-500/20">
                <button 
                  onClick={() => setShowDebug(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-1"
                >
                  <MinimizeIcon className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <BrainIcon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="font-bold text-slate-100 text-lg">{t.debugTitle}</h3>
                </div>
                <div className="space-y-4 text-sm text-slate-300">
                    <p className="leading-relaxed">The AI Architect follows a 3-Step Protocol to generate this simulation:</p>
                    <ul className="space-y-3 text-slate-400 text-xs">
                        <li className="flex gap-3">
                            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded h-fit font-mono text-[10px]">LOGIC</span>
                            <span>It identifies hardware that Wokwi doesn't support (e.g., 4K Cameras) and selects a functional mock (e.g., a Button to trigger 'Face Detected').</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded h-fit font-mono text-[10px]">PINOUT</span>
                            <span>It strictly maps pins to the <code className="text-white">wokwi-esp32-devkit-v1</code> standard (using D4, D2, VIN, GND.1).</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded h-fit font-mono text-[10px]">WIRING</span>
                            <span>It builds the <code className="text-white">diagram.json</code> connecting specific components (like <code className="text-white">servo1:V+</code> to <code className="text-white">esp:VIN</code>) to ensure power lines are visible.</span>
                        </li>
                    </ul>
                </div>
             </div>
          </div>
        )}
    </div>
  );
};

export default SimulationView;
