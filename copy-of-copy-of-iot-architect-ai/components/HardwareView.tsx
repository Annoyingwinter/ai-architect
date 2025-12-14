
import React from 'react';
import { HardwareComponent, PinConnection, Platform, Language } from '../types';
import { WrenchIcon, CableIcon, CpuIcon, BrainIcon } from './Icons';
import VisualWiringDiagram from './VisualWiringDiagram';

interface HardwareViewProps {
  hardwareList: HardwareComponent[];
  connections: PinConnection[];
  platform: Platform;
  language: Language;
}

const HardwareView: React.FC<HardwareViewProps> = ({ hardwareList, connections, platform, language }) => {
  const t = {
    blueprint: language === 'cn' ? "系统架构蓝图" : "System Blueprint",
    blueprintDesc: language === 'cn' ? "可视化连线拓扑仿真" : "Visual topology simulation",
    bom: language === 'cn' ? "硬件物料清单" : "Bill of Materials",
    bomDesc: language === 'cn' ? "项目所需硬件及选型理由" : "Required hardware for this project",
    pinout: language === 'cn' ? "接线引脚表" : "Pinout Table",
    pinoutDesc: language === 'cn' ? "详细引脚连接列表" : "Detailed connection list",
    component: language === 'cn' ? "组件名称" : "Component",
    compPin: language === 'cn' ? "组件引脚" : "Component Pin",
    mcuPin: language === 'cn' ? "主控引脚" : "MCU Pin",
    notes: language === 'cn' ? "备注" : "Notes"
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] overflow-auto">
      
      {/* Visual Wiring Blueprint (Simulation) */}
      <div className="bg-[#111625] border-b border-slate-800 p-8 pb-0">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <BrainIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">{t.blueprint}</h3>
              <p className="text-sm text-slate-500">{t.blueprintDesc}</p>
            </div>
         </div>
         <VisualWiringDiagram connections={connections} platform={platform} language={language} />
      </div>

      <div className="p-8">
        {/* Section 1: Bill of Materials (Shopping List) */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <WrenchIcon className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">{t.bom}</h3>
            <p className="text-sm text-slate-500">{t.bomDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {hardwareList.map((item, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex flex-col gap-2 hover:border-yellow-500/30 transition-colors">
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-200 text-lg">{item.name}</span>
                <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full font-mono">x{item.count}</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{item.description}</p>
              <div className="mt-auto pt-3 border-t border-slate-700/50">
                <p className="text-xs text-yellow-500/80 italic">"{item.reason}"</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section 2: Wiring Guide */}
        <div className="flex items-center gap-3 mb-6 border-t border-slate-800 pt-8">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <CableIcon className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">{t.pinout}</h3>
            <p className="text-sm text-slate-500">{t.pinoutDesc}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400 font-medium uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">{t.component}</th>
                <th className="px-6 py-4">{t.compPin}</th>
                <th className="px-6 py-4 flex items-center gap-2">
                    <CpuIcon className="w-4 h-4" /> {t.mcuPin}
                </th>
                <th className="px-6 py-4">{t.notes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {connections.map((conn, idx) => (
                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-200">{conn.component}</td>
                  <td className="px-6 py-4 font-mono text-yellow-400">{conn.pin}</td>
                  <td className="px-6 py-4 font-mono text-blue-400">→ {conn.targetPin}</td>
                  <td className="px-6 py-4 text-slate-500 italic">{conn.comment || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HardwareView;
