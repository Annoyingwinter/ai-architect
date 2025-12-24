
import React, { useState } from 'react';
import { Platform, GeneratedResponse, FileNode, Language, AIProvider } from './types';
import { generateEmbeddedProject } from './services/geminiService';
import { generateEmbeddedProjectWithDoubao } from './services/doubaoService';
import LogicFlowView from './components/LogicFlowView';
import FileExplorer from './components/FileExplorer';
import HardwareView from './components/HardwareView';
import AIChat from './components/AIChat';
import SimulationView from './components/SimulationView';
import JSZip from 'jszip';
import { 
  CpuIcon, 
  PlayIcon, 
  LoaderIcon, 
  CopyIcon, 
  BrainIcon, 
  FileTextIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  WrenchIcon,
  DownloadIcon,
  PrinterIcon,
  RefreshIcon,
  ChipIcon
} from './components/Icons';

// Translations Dictionary
const translations = {
    cn: {
        title: "AI 硬件架构师",
        subtitle: "技术可行性评估 & 嵌入式方案生成",
        step1: "硬件平台选择",
        step1b: "AI 模型选择",
        step2: "产品需求定义",
        promptPlaceholder: "请描述你的产品功能需求。\nAI 架构师将为你推荐传感器、电机并生成接线图和代码。\n\n例如：\n我想做一个桌面宠物机器人，要有视觉识别、语音互动和扬声器。看到人脸时它应该用舵机移动。",
        generateBtn: "生成工程方案",
        generatingBtn: "架构师思考中...",
        waitingTitle: "等待需求输入",
        waitingDesc: "请在左侧输入你的想法，AI 将自动生成物料清单 (BOM)、接线图和工程代码。",
        feasibilityApproved: "方案可行",
        feasibilityRejected: "方案驳回",
        project: "项目名称",
        tabs: {
            hardware: "硬件方案",
            code: "固件代码",
            simulation: "在线仿真",
            flowchart: "系统逻辑架构"
        },
        exportZip: "导出工程源码 (.zip)",
        printSpec: "打印/保存规格书 (PDF)",
        regenerate: "换一个方案",
        pmReport: "产品经理评估报告",
        editReq: "修改需求",
        summary: "架构师方案综述",
        copy: "复制",
        error: "生成失败 (网络或模型超时)，请重试。",
        retry: "重试",
        espDesc: "Wi-Fi / 蓝牙 / AI",
        stmDesc: "高性能 / 强实时性",
        geminiDesc: "Google Gemini",
        doubaoDesc: "字节豆包"
    },
    en: {
        title: "IoT Architect AI",
        subtitle: "Technical Feasibility & Implementation",
        step1: "Hardware Family",
        step1b: "AI Model",
        step2: "Product Requirements",
        promptPlaceholder: "Describe your product functionality here.\nThe AI Architect will recommend sensors, motors, wiring, and code.\n\nExample:\nI want to build a Desktop Pet Robot with Vision, Voice Recognition, and a Speaker. It should move using servos when it sees a face.",
        generateBtn: "Generate Solution",
        generatingBtn: "Consulting Architect...",
        waitingTitle: "Waiting for Product Definition",
        waitingDesc: "Enter your requirements on the left. The AI will generate a Hardware BOM, Wiring Diagram, and Code.",
        feasibilityApproved: "Feasibility Approved",
        feasibilityRejected: "Feasibility Rejected",
        project: "Project",
        tabs: {
            hardware: "Hardware",
            code: "Firmware",
            simulation: "Simulation",
            flowchart: "Logic Architecture"
        },
        exportZip: "Export Project (.zip)",
        printSpec: "Print / Save Spec (PDF)",
        regenerate: "Try Another Solution",
        pmReport: "Product Manager Report",
        editReq: "Edit Requirements",
        summary: "Architect's Summary",
        copy: "Copy",
        error: "Generation Failed (Network/Timeout). Please Retry.",
        retry: "Retry",
        espDesc: "Wi-Fi / BLE / AI",
        stmDesc: "High Perf / Real-time",
        geminiDesc: "Google Gemini",
        doubaoDesc: "ByteDance Doubao"
    }
};

const App: React.FC = () => {
  const [platform, setPlatform] = useState<Platform>(Platform.ESP32);
  const [aiProvider, setAiProvider] = useState<AIProvider>(AIProvider.GEMINI);
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GeneratedResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [activeTab, setActiveTab] = useState<'hardware' | 'code' | 'flowchart' | 'simulation'>('hardware');
  const [language, setLanguage] = useState<Language>('cn'); // Default to Chinese
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      let data: GeneratedResponse;
      if (aiProvider === AIProvider.DOUBAO) {
        data = await generateEmbeddedProjectWithDoubao(platform, prompt, language);
      } else {
        data = await generateEmbeddedProject(platform, prompt, language);
      }
      setResult(data);
      if (data.isPossible && data.project) {
        // Default to hardware view first for beginners
        setActiveTab('hardware');
        // Select main code file by default
        const mainFile = data.project.files.find(f => f.path.endsWith('.ino') || f.path === 'main.cpp') || data.project.files[0];
        if (mainFile) {
            setSelectedFile(mainFile);
        }
      }
    } catch (err) {
      console.error(err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
    }
  };

  const handleDownloadProject = async () => {
    if (!result?.project) return;
    
    const zip = new JSZip();
    result.project.files.forEach(file => {
        zip.file(file.path, file.content);
    });

    try {
        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${result.project.projectName.replace(/\s+/g, '_').toLowerCase()}_project.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (e) {
        console.error("Zip generation failed", e);
        alert("Could not generate ZIP file.");
    }
  };

  const handlePrintSpec = () => {
    if (!result?.project) return;
    const { projectName, description, hardwareList, connections } = result.project;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const hardwareRows = hardwareList.map(h => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px;"><strong>${h.name}</strong><br><span style="font-size:12px; color:#666;">${h.description}</span></td>
            <td style="padding: 8px; text-align: center;">${h.count}</td>
            <td style="padding: 8px; font-size:12px; font-style: italic;">${h.reason}</td>
        </tr>
    `).join('');

    const connectionRows = connections.map(c => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px;">${c.component}</td>
            <td style="padding: 8px;">${c.pin}</td>
            <td style="padding: 8px; font-family: monospace; font-weight: bold;">${c.targetPin}</td>
            <td style="padding: 8px; font-size:12px;">${c.comment || ''}</td>
        </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Spec Sheet - ${projectName}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 24px; border-bottom: 2px solid #334155; padding-bottom: 10px; margin-bottom: 20px; }
            h2 { font-size: 18px; margin-top: 30px; background: #f1f5f9; padding: 8px; border-radius: 4px; }
            p { line-height: 1.5; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th { text-align: left; padding: 8px; background: #e2e8f0; border-bottom: 2px solid #cbd5e1; }
            .meta { font-size: 12px; color: #94a3b8; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <h1>${projectName}</h1>
          <div class="meta">Generated by IoT Architect AI | Platform: ${platform}</div>
          
          <h2>Project Description</h2>
          <p>${description}</p>
          
          <h2>Bill of Materials (BOM)</h2>
          <table>
            <thead>
                <tr>
                    <th width="40%">Component</th>
                    <th width="10%">Qty</th>
                    <th>Reason</th>
                </tr>
            </thead>
            <tbody>
                ${hardwareRows}
            </tbody>
          </table>

          <h2>Wiring Spec</h2>
          <table>
            <thead>
                <tr>
                    <th>Component</th>
                    <th>Pin</th>
                    <th>MCU Pin</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                ${connectionRows}
            </tbody>
          </table>

          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #cbd5e1;">
            End of Specification
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 flex flex-col font-sans">
      {/* Header - Professional Look */}
      <header className="h-16 border-b border-slate-800 bg-[#0f172a] flex items-center px-6 justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded shadow-lg shadow-indigo-500/20">
            <BrainIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">
              {t.title}
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold hidden sm:block">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {/* Language Switcher */}
           <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
             <button 
                onClick={() => setLanguage('cn')} 
                className={`px-2 py-1 text-xs font-bold rounded ${language === 'cn' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
                CN
             </button>
             <button 
                onClick={() => setLanguage('en')} 
                className={`px-2 py-1 text-xs font-bold rounded ${language === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
                EN
             </button>
           </div>
           
           <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
           <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
             <span className="w-2 h-2 rounded-full bg-green-500"></span> System Online
           </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left Panel: Product Definition (PRD) */}
        <div className={`lg:w-[400px] w-full flex flex-col border-r border-slate-800 bg-[#0f172a] z-10 ${result ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 space-y-8 overflow-y-auto flex-1">
            
            {/* Step 1: Hardware Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-wider">
                <span className="bg-indigo-500/10 px-2 py-1 rounded">Step 01</span>
                {t.step1}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPlatform(Platform.ESP32)}
                  className={`p-3 rounded-lg border transition-all flex items-center gap-3 ${
                    platform === Platform.ESP32
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-700 hover:border-slate-600 text-slate-400'
                  }`}
                >
                  <CpuIcon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-bold text-sm">ESP32</div>
                    <div className="text-[10px] opacity-60">{t.espDesc}</div>
                  </div>
                </button>
                <button
                  onClick={() => setPlatform(Platform.STM32)}
                  className={`p-3 rounded-lg border transition-all flex items-center gap-3 ${
                    platform === Platform.STM32
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-700 hover:border-slate-600 text-slate-400'
                  }`}
                >
                  <CpuIcon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-bold text-sm">STM32</div>
                    <div className="text-[10px] opacity-60">{t.stmDesc}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 1b: AI Model Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-wider">
                <span className="bg-indigo-500/10 px-2 py-1 rounded">Step 01b</span>
                {t.step1b}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAiProvider(AIProvider.GEMINI)}
                  className={`p-3 rounded-lg border transition-all flex items-center gap-3 ${
                    aiProvider === AIProvider.GEMINI
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-700 hover:border-slate-600 text-slate-400'
                  }`}
                >
                  <BrainIcon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-bold text-sm">Gemini</div>
                    <div className="text-[10px] opacity-60">{t.geminiDesc}</div>
                  </div>
                </button>
                <button
                  onClick={() => setAiProvider(AIProvider.DOUBAO)}
                  className={`p-3 rounded-lg border transition-all flex items-center gap-3 ${
                    aiProvider === AIProvider.DOUBAO
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-700 hover:border-slate-600 text-slate-400'
                  }`}
                >
                  <BrainIcon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-bold text-sm">Doubao</div>
                    <div className="text-[10px] opacity-60">{t.doubaoDesc}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Product Requirements */}
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-wider">
                <span className="bg-indigo-500/10 px-2 py-1 rounded">Step 02</span>
                {t.step2}
              </div>
              <div className="relative flex-1">
                <FileTextIcon className="absolute top-4 left-4 w-5 h-5 text-slate-500" />
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.promptPlaceholder}
                  className="w-full h-full min-h-[200px] bg-slate-900/50 border border-slate-700 rounded-lg pl-12 p-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all placeholder-slate-600 font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className={`w-full py-4 rounded-lg font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-3 transition-all ${
                loading || !prompt.trim()
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500'
              }`}
            >
              {loading ? (
                <>
                  <LoaderIcon className="w-5 h-5 animate-spin" />
                  {t.generatingBtn}
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 fill-current" />
                  {t.generateBtn}
                </>
              )}
            </button>
            
            {error && (
                <div className="p-3 mt-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="flex-1 mr-2">{error}</span>
                    <button onClick={handleGenerate} className="whitespace-nowrap underline hover:text-red-300 font-bold">{t.retry}</button>
                </div>
            )}
          </div>
        </div>

        {/* Right Panel: Output Dashboard */}
        <div className={`flex-1 flex flex-col bg-[#0b0f19] relative overflow-hidden ${!result ? 'hidden lg:flex' : 'flex'}`}>
          {!result ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 select-none pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 border border-slate-700/50">
                <BrainIcon className="w-10 h-10 opacity-50" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{t.waitingTitle}</h2>
              <p className="text-sm max-w-xs text-center opacity-60">{t.waitingDesc}</p>
            </div>
          ) : (
            <>
              {/* Feasibility Header */}
              <div className={`px-6 py-4 border-b ${result.isPossible ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
                <div className="flex items-center gap-4">
                  {result.isPossible ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircleIcon className="w-6 h-6" />
                      <span className="font-bold text-lg">{t.feasibilityApproved}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircleIcon className="w-6 h-6" />
                      <span className="font-bold text-lg">{t.feasibilityRejected}</span>
                    </div>
                  )}
                  {result.project && (
                    <span className="text-slate-500 text-sm hidden md:inline-block">
                      / {t.project}: <span className="text-slate-300 font-medium">{result.project.projectName}</span>
                    </span>
                  )}
                </div>
                {result.isPossible && (
                    <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
                        <div className="flex bg-slate-800 rounded p-1 gap-1 shrink-0">
                            <button onClick={() => setActiveTab('hardware')} className={`px-4 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${activeTab === 'hardware' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}>
                            <WrenchIcon className="w-3 h-3"/> {t.tabs.hardware}
                            </button>
                            <button onClick={() => setActiveTab('code')} className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'code' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}>
                                {t.tabs.code}
                            </button>
                            <button onClick={() => setActiveTab('simulation')} className={`px-4 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${activeTab === 'simulation' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}>
                                <ChipIcon className="w-3 h-3"/> {t.tabs.simulation}
                            </button>
                            <button onClick={() => setActiveTab('flowchart')} className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'flowchart' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}>
                                {t.tabs.flowchart}
                            </button>
                        </div>
                        
                        <div className="h-6 w-px bg-slate-700 hidden md:block"></div>

                        <div className="flex gap-2 shrink-0">
                             <button 
                                onClick={handleGenerate} 
                                className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
                                title={t.regenerate}
                             >
                                <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                             </button>
                             <button 
                                onClick={handleDownloadProject}
                                className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                title={t.exportZip}
                             >
                                <DownloadIcon className="w-5 h-5" />
                             </button>
                             <button 
                                onClick={handlePrintSpec}
                                className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                title={t.printSpec}
                             >
                                <PrinterIcon className="w-5 h-5" />
                             </button>
                        </div>
                    </div>
                  )}
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-hidden relative">
                {!result.isPossible ? (
                  // Rejection View
                  <div className="h-full flex flex-col items-center justify-center p-8">
                    <div className="max-w-2xl w-full bg-[#0f172a] border border-red-900/30 rounded-xl p-8 shadow-2xl">
                        <h3 className="text-red-400 font-bold mb-4 uppercase text-xs tracking-wider">{t.pmReport}</h3>
                        <p className="text-xl text-slate-200 leading-relaxed font-light mb-6">
                            "{result.impossibilityReason}"
                        </p>
                        <div className="h-px bg-slate-800 w-full mb-6"></div>
                        <p className="text-slate-500 text-sm">
                            The requested features are not compatible with the selected hardware ({platform}). Please revise the requirements or switch the hardware platform.
                        </p>
                        <button 
                            onClick={() => {setResult(null); setPrompt('');}}
                            className="mt-8 text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-2"
                        >
                            ← {t.editReq}
                        </button>
                    </div>
                  </div>
                ) : (
                  // Success View
                  result.project && (
                    <>
                        {activeTab === 'hardware' && (
                            <HardwareView 
                                hardwareList={result.project.hardwareList} 
                                connections={result.project.connections}
                                platform={platform}
                                language={language}
                            />
                        )}

                        {activeTab === 'code' && (
                             <div className="flex h-full">
                                {/* File Tree */}
                                <div className="w-64 border-r border-slate-800 bg-[#0f172a] hidden md:block">
                                  <FileExplorer 
                                    files={result.project.files} 
                                    selectedFile={selectedFile} 
                                    onSelect={setSelectedFile}
                                    language={language}
                                  />
                                  <div className="p-4 border-t border-slate-800">
                                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">{t.summary}</div>
                                      <p className="text-xs text-slate-400 leading-relaxed max-h-40 overflow-y-auto pr-2">
                                          {result.project.explanation}
                                      </p>
                                  </div>
                                </div>
                                
                                {/* Code Editor */}
                                <div className="flex-1 flex flex-col h-full bg-[#1e1e1e]">
                                  <div className="h-10 border-b border-[#2d2d2d] flex items-center justify-between px-4 bg-[#1e1e1e]">
                                    <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
                                       {selectedFile?.path}
                                    </span>
                                    <button 
                                        onClick={copyToClipboard}
                                        className="text-xs text-slate-500 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
                                    >
                                        <CopyIcon className="w-3.5 h-3.5" /> {t.copy}
                                    </button>
                                  </div>
                                  <div className="flex-1 overflow-auto p-6">
                                    <pre className="text-sm font-mono text-slate-300 leading-6">
                                      <code>{selectedFile?.content}</code>
                                    </pre>
                                  </div>
                                </div>
                              </div>
                        )}

                        {activeTab === 'simulation' && (
                            <SimulationView 
                                project={result.project} 
                                language={language}
                                platform={platform}
                            />
                        )}

                        {activeTab === 'flowchart' && (
                            <LogicFlowView 
                                logicStates={result.project.logicStates}
                                language={language}
                            />
                        )}

                        {/* Floating AI Chat Assistant */}
                        <AIChat project={result.project} language={language} aiProvider={aiProvider} />
                    </>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
