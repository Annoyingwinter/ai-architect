
import React from 'react';
import { FileNode, Language } from '../types';
import { FolderIcon, FileCodeIcon } from './Icons';

interface FileExplorerProps {
  files: FileNode[];
  selectedFile: FileNode | null;
  onSelect: (file: FileNode) => void;
  language: Language;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFile, onSelect, language }) => {
  // Simple structure mapping for demo purposes. 
  // In a real app we might parse paths into a tree object.
  // Here we just list them flat but style them nicely.

  const title = language === 'cn' ? "项目文件" : "Project Files";

  return (
    <div className="w-full h-full bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700 font-semibold text-slate-300 flex items-center gap-2">
        <FolderIcon className="w-5 h-5 text-yellow-500" />
        {title}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => onSelect(file)}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition-colors ${
                selectedFile?.path === file.path
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              <FileCodeIcon className="w-4 h-4" />
              <span className="text-sm font-mono truncate">{file.path}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
