
import React from 'react';
import { LogicState, Language } from '../types';
import { ArrowRightIcon, BrainIcon } from './Icons';

interface LogicFlowViewProps {
  logicStates: LogicState[];
  language: Language;
}

const LogicFlowView: React.FC<LogicFlowViewProps> = ({ logicStates, language }) => {
  if (!logicStates || logicStates.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p>No logic architecture defined.</p>
          </div>
      );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0b0f19] p-8">
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                <div className="bg-indigo-500/10 p-3 rounded-xl">
                    <BrainIcon className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">
                        {language === 'cn' ? "系统逻辑架构" : "System Logic Architecture"}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {language === 'cn' ? "有限状态机 (FSM) 核心流程" : "Finite State Machine (FSM) Core Flow"}
                    </p>
                </div>
            </div>

            <div className="relative">
                {/* Connecting Line (Vertical) */}
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500/50 via-slate-700/50 to-transparent"></div>

                <div className="space-y-8 relative">
                    {logicStates.map((state, idx) => (
                        <div key={idx} className="relative pl-16 group">
                            {/* Step Indicator Dot */}
                            <div className="absolute left-[19px] top-6 w-3 h-3 rounded-full bg-slate-900 border-2 border-indigo-500 z-10 group-hover:bg-indigo-500 transition-colors shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>

                            <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-6 shadow-lg hover:border-indigo-500/30 transition-all hover:shadow-indigo-500/5 hover:-translate-y-1">
                                {/* State Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-bold text-indigo-300 font-mono tracking-wide">
                                        {state.state}
                                    </h3>
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 uppercase font-bold">
                                        Step {idx + 1}
                                    </span>
                                </div>
                                
                                {/* Description */}
                                <p className="text-slate-300 text-sm mb-6 leading-relaxed bg-slate-900/30 p-3 rounded-lg border border-slate-800/50">
                                    {state.description}
                                </p>

                                {/* Transitions */}
                                {state.transitions && state.transitions.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                            {language === 'cn' ? "流转条件 (Transitions)" : "Transitions"}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {state.transitions.map((t, tIdx) => (
                                                <div key={tIdx} className="bg-slate-800/80 rounded px-3 py-2 flex items-center justify-between border border-slate-700/50 text-xs">
                                                    <span className="text-slate-300 italic">"{t.condition}"</span>
                                                    <div className="flex items-center gap-2 text-indigo-400 font-mono font-bold">
                                                        <ArrowRightIcon className="w-3 h-3" />
                                                        {t.target}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="text-center pt-8 pb-4">
                <p className="text-xs text-slate-600">
                    {language === 'cn' ? "逻辑流程结束" : "End of Logic Flow"}
                </p>
            </div>
        </div>
    </div>
  );
};

export default LogicFlowView;
