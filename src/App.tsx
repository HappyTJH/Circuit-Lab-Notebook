import React, { useState, useEffect } from 'react';
import { ExperimentRecord } from './types';
import { ExperimentCard } from './components/ExperimentCard';
import { Plus, BookOpen, Download, RotateCcw } from 'lucide-react';

function App() {
  const [records, setRecords] = useState<ExperimentRecord[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<ExperimentRecord[]>([]);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().slice(0, 8);
    }
    return Math.random().toString(36).substring(2, 10);
  };

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('circuit-lab-notebook');
    if (saved) {
      try {
        const parsedRecords = JSON.parse(saved);
        // Migration logic for old records
        const migratedRecords = parsedRecords.map((rec: any, index: number) => ({
          ...rec,
          // If sequenceNumber is missing, assign based on reverse index (assuming newest first)
          sequenceNumber: rec.sequenceNumber ?? (parsedRecords.length - index),
          experimenter: rec.experimenter ?? '',
          voltages: rec.voltages ?? {}
        }));
        setRecords(migratedRecords);
      } catch (e) {
        console.error("Failed to load records", e);
      }
    } else {
      // Create an initial empty record if nothing exists
      const newRecord: ExperimentRecord = {
        id: generateId(),
        sequenceNumber: 1,
        timestamp: Date.now(),
        experimenter: '',
        transistors: {},
        capacitors: {},
        voltages: {},
        waveformImage: null,
        observations: ''
      };
      setRecords([newRecord]);
    }
  }, []);

  // Save to local storage whenever records change
  useEffect(() => {
    localStorage.setItem('circuit-lab-notebook', JSON.stringify(records));
  }, [records]);

  const addRecord = () => {
    // Calculate next sequence number
    const maxSeq = records.reduce((max, rec) => Math.max(max, rec.sequenceNumber || 0), 0);
    
    const newRecord: ExperimentRecord = {
      id: generateId(),
      sequenceNumber: maxSeq + 1,
      timestamp: Date.now(),
      // Copy experimenter from the most recent record if available
      experimenter: records.length > 0 ? records[0].experimenter : '',
      transistors: {},
      capacitors: {},
      voltages: {},
      waveformImage: null,
      observations: ''
    };
    setRecords(prev => [newRecord, ...prev]);
  };

  const duplicateRecord = (sourceRecord: ExperimentRecord) => {
    const maxSeq = records.reduce((max, rec) => Math.max(max, rec.sequenceNumber || 0), 0);

    const newRecord: ExperimentRecord = {
      ...sourceRecord,
      id: generateId(),
      sequenceNumber: maxSeq + 1,
      timestamp: Date.now(),
      // We keep the data but maybe we want to clear the image? 
      // The user said "content exactly the same as before", so we keep everything.
    };
    setRecords(prev => [newRecord, ...prev]);
  };

  const updateRecord = (id: string, updates: Partial<ExperimentRecord>) => {
    setRecords(prev => prev.map(rec => rec.id === id ? { ...rec, ...updates } : rec));
  };

  const deleteRecord = (id: string) => {
    const recordToDelete = records.find(rec => rec.id === id);
    if (recordToDelete) {
      setDeletedRecords(prev => [...prev, recordToDelete]);
      setRecords(prev => prev.filter(rec => rec.id !== id));
    }
  };

  const undoDelete = () => {
    if (deletedRecords.length === 0) return;
    
    const recordToRestore = deletedRecords[deletedRecords.length - 1];
    setDeletedRecords(prev => prev.slice(0, -1));
    
    setRecords(prev => {
      const newRecords = [recordToRestore, ...prev];
      // Sort by sequence number descending to maintain order
      return newRecords.sort((a, b) => (b.sequenceNumber || 0) - (a.sequenceNumber || 0));
    });
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "experiment_records_" + new Date().toISOString() + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Circuit Lab Notebook</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportData}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <button 
              onClick={addRecord}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Experiment
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Experiment Log</h2>
            <p className="text-sm text-gray-500 mt-1">
              {records.length} {records.length === 1 ? 'record' : 'records'} stored locally
            </p>
          </div>
          {deletedRecords.length > 0 && (
            <button 
              onClick={undoDelete}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Undo Delete ({deletedRecords.length})
            </button>
          )}
        </div>

        <div className="space-y-6">
          {records.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No experiments recorded</h3>
              <p className="text-gray-500 mt-1 mb-6">Start by creating a new experiment record.</p>
              <button 
                onClick={addRecord}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
              >
                <Plus className="w-4 h-4" />
                Create Record
              </button>
            </div>
          ) : (
            records.map(record => (
              <ExperimentCard
                key={record.id}
                record={record}
                onUpdate={updateRecord}
                onDelete={deleteRecord}
                onDuplicate={duplicateRecord}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
