
import React, { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Robust Sanitizer Function
  const sanitizeMermaidCode = (code: string) => {
    if (!code) return "";

    let clean = code
        .replace(/```mermaid/g, '')
        .replace(/```/g, '')
        .trim();

    // 1. Fix Chinese Punctuation & Quotes
    // Replace Chinese quotes with English quotes
    clean = clean.replace(/[“”]/g, '"');
    clean = clean.replace(/[‘’]/g, "'");
    
    // 2. Fix Invalid "Pipe" starts (e.g. "|Node") -> Change to link or remove
    // If a line starts with |NodeID[, it's likely a hallucinated link. Change to -->
    clean = clean.replace(/^\s*\|([A-Za-z0-9_]+)/gm, ' --> $1');

    // 3. Normalize Node Labels
    // Use shape-specific regexes to avoid mixed-delimiter issues
    // This allows () to exist inside [] without breaking the regex
    const replaceLabel = (pattern: RegExp, open: string, close: string) => {
        clean = clean.replace(pattern, (match, id, content) => {
            // Ignore keywords
            if (['subgraph', 'classDef', 'style', 'click', 'linkStyle'].includes(id)) return match;
            
            let inner = content.trim();
            // Strip outer quotes if already present
            if (inner.startsWith('"') && inner.endsWith('"')) {
                inner = inner.slice(1, -1);
            }
            // Escape inner double quotes to single quotes
            inner = inner.replace(/"/g, "'");
            
            return `${id}${open}"${inner}"${close}`;
        });
    };

    // Process specific shapes.
    // Note: We use specific lookaheads/lookbehinds or strict matching to avoid splitting double-shapes.
    
    // 3a. Double Shapes (Process first or distinctly)
    // ((...))
    replaceLabel(/([A-Za-z0-9_]+)\s*\(\((.*?)\)\)/g, '((', '))');
    // {{...}}
    replaceLabel(/([A-Za-z0-9_]+)\s*\{\{(.*?)\}\}/g, '{{', '}}');
    // [[...]]
    replaceLabel(/([A-Za-z0-9_]+)\s*\[\[(.*?)\]\]/g, '[[', ']]');
    // [(...)]
    replaceLabel(/([A-Za-z0-9_]+)\s*\[\((.*?)\)\]/g, '[(', ')]');

    // 3b. Single Shapes (Most common)
    // [...] - Square Brackets
    replaceLabel(/([A-Za-z0-9_]+)\s*\[(.*?)\]/g, '[', ']');
    // {...} - Curly Braces
    replaceLabel(/([A-Za-z0-9_]+)\s*\{(.*?)\}/g, '{', '}');
    // (...) - Round Brackets. Use lookahead (?!\() to avoid matching ((...)) start
    replaceLabel(/([A-Za-z0-9_]+)\s*\((?!\()(.*?)(?<!\))\)/g, '(', ')');

    // 4. Force Newlines / Fix Semicolons
    // Replace semicolons with newlines
    clean = clean.replace(/;/g, '\n');
    
    // CRITICAL FIX: "Multiple Nodes One Line" error: NodeA["Tx"] NodeB["Rx"]
    // Detect closing delimiter followed by a new Node ID
    clean = clean.replace(/([\]\)\}])([ \t]+)([A-Za-z0-9_]+)/g, '$1\n$3');

    // 5. Ensure Header
    if (!clean.startsWith('graph') && !clean.startsWith('flowchart')) {
        clean = 'graph TD\n' + clean;
    }

    return clean;
  };

  useEffect(() => {
    if (!chart) {
        setError("Flowchart data is missing.");
        return;
    }
    setError(null);

    const cleanChart = sanitizeMermaidCode(chart);

    if (containerRef.current && window.mermaid) {
      window.mermaid.initialize({ 
        startOnLoad: true, 
        theme: 'dark',
        securityLevel: 'loose',
        flowchart: { 
            curve: 'basis',
            padding: 20,
            htmlLabels: true
        }
      });
      
      const renderId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      containerRef.current.innerHTML = '';
      
      try {
        window.mermaid.render(renderId, cleanChart).then(({ svg }) => {
            if (containerRef.current) {
                containerRef.current.innerHTML = svg;
            }
        }).catch((e: any) => {
            console.error("Mermaid Render Promise Error:", e);
            // Fallback: Try to render a simple error node
            try {
                const fallback = `graph TD\nError["Syntax Error in Diagram"]\nNote["${e.message?.replace(/"/g, "'").slice(0,50)}..."]`;
                window.mermaid.render(renderId + "-err", fallback).then(({ svg }) => {
                     if (containerRef.current) containerRef.current.innerHTML = svg;
                });
            } catch(err) {}
            
            setError("Syntax Error: " + (e.message || "Unknown"));
        });
      } catch (e: any) {
        console.error("Mermaid Render Error:", e);
        setError("Failed to render flowchart");
      }
    }
  }, [chart]);

  return (
    <div className="w-full overflow-x-auto p-6 bg-[#0f172a] rounded-xl border border-slate-700 flex justify-center items-center min-h-[300px]">
      {error ? (
          <div className="text-red-400 flex flex-col items-center gap-2 text-center w-full">
            <span className="font-bold">⚠️ Logic Flowchart Error</span>
            <span className="text-xs opacity-70">{error}</span>
            <div className="w-full max-w-2xl bg-black/50 p-4 rounded text-left overflow-auto max-h-40 border border-red-900/30">
                <code className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap">
                    {sanitizeMermaidCode(chart)}
                </code>
            </div>
          </div>
      ) : (
          <div ref={containerRef} className="mermaid-container w-full flex justify-center" />
      )}
    </div>
  );
};

export default MermaidDiagram;
