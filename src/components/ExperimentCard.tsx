import React, { useRef } from 'react';
import { ExperimentRecord, TRANSISTOR_NAMES, CAPACITOR_NAMES, VOLTAGE_NAMES } from '../types';
import { TransistorInput } from './TransistorInput';
import { Trash2, Upload, FileText, Activity, Cpu, Zap, User, Gauge } from 'lucide-react';

interface ExperimentCardProps {
  record: ExperimentRecord;
  onUpdate: (id: string, updates: Partial<ExperimentRecord>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (record: ExperimentRecord) => void;
}

export const ExperimentCard: React.FC<ExperimentCardProps> = ({ record, onUpdate, onDelete, onDuplicate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTransistorChange = (name: string, field: 'W' | 'L', value: string) => {
    const newTransistors = { ...record.transistors };
    if (!newTransistors[name]) {
      newTransistors[name] = { W: '', L: '' };
    }
    newTransistors[name] = { ...newTransistors[name], [field]: value };
    onUpdate(record.id, { transistors: newTransistors });
  };

  const handleCapacitorChange = (name: string, value: string) => {
    const newCapacitors = { ...record.capacitors, [name]: value };
    onUpdate(record.id, { capacitors: newCapacitors });
  };

  const handleVoltageChange = (name: string, value: string) => {
    const newVoltages = { ...record.voltages, [name]: value };
    onUpdate(record.id, { voltages: newVoltages });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(record.id, { waveformImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString();
  };

  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteClick = () => {
    if (isDeleting) {
      onDelete(record.id);
    } else {
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 3000); // Reset after 3 seconds
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 transition-all hover:shadow-md">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Experiment Record {record.sequenceNumber?.toString().padStart(3, '0')}
            </h3>
            <p className="text-xs text-gray-500 font-mono">{record.id} • {formatDate(record.timestamp)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onDuplicate(record)}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Duplicate
          </button>
          <button 
            onClick={handleDeleteClick}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
              isDeleting 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "text-gray-400 hover:text-red-600 hover:bg-red-50"
            }`}
            title="Delete Record"
          >
            {isDeleting ? (
              <>Confirm?</>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Experimenter Field */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Experimenter</h4>
          </div>
          <input
            type="text"
            value={record.experimenter || ''}
            onChange={(e) => onUpdate(record.id, { experimenter: e.target.value })}
            className="w-full md:w-1/3 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your name"
          />
        </section>

        {/* Transistors Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Transistor Parameters (W / L)</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {TRANSISTOR_NAMES.map((name) => (
              <TransistorInput
                key={name}
                name={name}
                wValue={record.transistors[name]?.W || ''}
                lValue={record.transistors[name]?.L || ''}
                onChange={handleTransistorChange}
              />
            ))}
          </div>
        </section>

        {/* Capacitors & Voltages Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Capacitors</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CAPACITOR_NAMES.map((name) => (
                <div key={name} className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 font-mono">{name}</label>
                  <input
                    type="text"
                    value={record.capacitors[name] || ''}
                    onChange={(e) => handleCapacitorChange(name, e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Value (e.g. 10fF)"
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Voltages (mV)</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {VOLTAGE_NAMES.map((name) => (
                <div key={name} className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 font-mono">{name}</label>
                  <input
                    type="text"
                    value={record.voltages?.[name] || ''}
                    onChange={(e) => handleVoltageChange(name, e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="mV"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Waveform Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Waveform / Simulation Result</h4>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] bg-gray-50 hover:bg-gray-100 transition-colors relative">
              {record.waveformImage ? (
                <div className="relative w-full h-full group">
                  <img 
                    src={record.waveformImage} 
                    alt="Waveform" 
                    className="max-h-[300px] w-full object-contain rounded-md" 
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                    <button 
                      onClick={() => onUpdate(record.id, { waveformImage: null })}
                      className="bg-red-500 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-red-600"
                    >
                      Remove Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 cursor-pointer">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium cursor-pointer">Click to upload waveform image</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>
          </section>

          {/* Observations Section */}
          <section className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Experimental Phenomena & Notes</h4>
            </div>
            <textarea
              value={record.observations}
              onChange={(e) => onUpdate(record.id, { observations: e.target.value })}
              className="flex-1 w-full p-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[200px]"
              placeholder="Record special phenomena, unexpected behaviors, or analysis notes here..."
            />
          </section>
        </div>
      </div>
    </div>
  );
};
