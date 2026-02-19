import React from 'react';

interface TransistorInputProps {
  name: string;
  wValue: string;
  lValue: string;
  onChange: (name: string, field: 'W' | 'L', value: string) => void;
}

export const TransistorInput: React.FC<TransistorInputProps> = ({ name, wValue, lValue, onChange }) => {
  return (
    <div className="flex flex-col p-2 border border-gray-200 rounded-md bg-gray-50">
      <span className="text-xs font-bold text-gray-500 mb-1 font-mono">{name}</span>
      <div className="flex gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">W</span>
          <input
            type="text"
            value={wValue}
            onChange={(e) => onChange(name, 'W', e.target.value)}
            className="w-full min-w-0 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="µm"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">L</span>
          <input
            type="text"
            value={lValue}
            onChange={(e) => onChange(name, 'L', e.target.value)}
            className="w-full min-w-0 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="µm"
          />
        </div>
      </div>
    </div>
  );
};
