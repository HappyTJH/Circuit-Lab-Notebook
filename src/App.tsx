import React, { useState, useEffect } from 'react';
import { experimentService } from './services/experimentService';
import { ExperimentRecord, ExperimentRecordInput } from './types/experiment';
import { ExperimentCard } from './components/ExperimentCard';
import { Plus, BookOpen, Download, RotateCcw } from 'lucide-react';

function App() {
  const [records, setRecords] = useState<ExperimentRecord[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<ExperimentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load records on mount
  useEffect(() => {
    loadRecords();

    // Subscribe to real-time changes
    const unsubscribe = experimentService.onRecordsChange((updatedRecords) => {
      setRecords(updatedRecords);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      const fetchedRecords = await experimentService.getAllRecords();
      setRecords(fetchedRecords);
      setError(null);
    } catch (err) {
      console.error('Failed to load records:', err);
      setError('Failed to load records from database. Using local backup if available.');
      
      // Fallback to local storage
      const saved = localStorage.getItem('circuit-lab-notebook');
      if (saved) {
        try {
          const parsedRecords = JSON.parse(saved);
          // Map old format to new format if necessary
          const migratedRecords = parsedRecords.map((rec: any) => ({
            id: rec.id,
            user_id: rec.user_id || 'local',
            sequence_number: rec.sequenceNumber ?? rec.sequence_number ?? 0,
            timestamp: rec.timestamp,
            experimenter: rec.experimenter || '',
            transistors: rec.transistors || {},
            capacitors: rec.capacitors || {},
            voltages: rec.voltages || {},
            waveform_image: rec.waveformImage ?? rec.waveform_image ?? '',
            observations: rec.observations || '',
            created_at: rec.created_at || new Date().toISOString(),
            updated_at: rec.updated_at || new Date().toISOString()
          }));
          setRecords(migratedRecords);
        } catch (e) {
          console.error("Failed to parse local records", e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addRecord = async () => {
    const maxSeq = records.reduce((max, rec) => Math.max(max, rec.sequence_number || 0), 0);
    
    const newRecordInput: ExperimentRecordInput = {
      sequence_number: maxSeq + 1,
      timestamp: Date.now(),
      experimenter: records.length > 0 ? records[0].experimenter : '',
      transistors: {},
      capacitors: {},
      voltages: {},
      waveform_image: '',
      observations: ''
    };

    try {
      await experimentService.createRecord(newRecordInput);
      // State update handled by subscription
      setError(null);
    } catch (err) {
      console.error('Failed to create record:', err);
      setError('Failed to create record. Please try again.');
      // Local fallback logic could go here if needed
    }
  };

  const duplicateRecord = async (sourceRecord: ExperimentRecord) => {
    const maxSeq = records.reduce((max, rec) => Math.max(max, rec.sequence_number || 0), 0);

    const newRecordInput: ExperimentRecordInput = {
      sequence_number: maxSeq + 1,
      timestamp: Date.now(),
      experimenter: sourceRecord.experimenter,
      transistors: sourceRecord.transistors,
      capacitors: sourceRecord.capacitors,
      voltages: sourceRecord.voltages,
      waveform_image: sourceRecord.waveform_image,
      observations: sourceRecord.observations
    };

    try {
      await experimentService.createRecord(newRecordInput);
      setError(null);
    } catch (err) {
      console.error('Failed to duplicate record:', err);
      setError('Failed to duplicate record.');
    }
  };

  const updateRecord = async (id: string, updates: Partial<ExperimentRecord>) => {
    // Optimistic update
    setRecords(prev => prev.map(rec => rec.id === id ? { ...rec, ...updates } : rec));

    try {
      // We need to convert Partial<ExperimentRecord> to Partial<ExperimentRecordInput>
      // The types are compatible for the shared fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, user_id: __, created_at: ___, updated_at: ____, ...inputUpdates } = updates as any;
      
      await experimentService.updateRecord(id, inputUpdates);
      setError(null);
    } catch (err) {
      console.error('Failed to update record:', err);
      setError('Failed to update record.');
      // Revert optimistic update? Or just let the next subscription update fix it?
      loadRecords(); 
    }
  };

  const deleteRecord = async (id: string) => {
    const recordToDelete = records.find(rec => rec.id === id);
    if (recordToDelete) {
      setDeletedRecords(prev => [...prev, recordToDelete]);
      
      // Optimistic delete
      setRecords(prev => prev.filter(rec => rec.id !== id));

      try {
        await experimentService.deleteRecord(id);
        setError(null);
      } catch (err) {
        console.error('Failed to delete record:', err);
        setError('Failed to delete record.');
        loadRecords(); // Revert
      }
    }
  };

  const undoDelete = async () => {
    if (deletedRecords.length === 0) return;
    
    const recordToRestore = deletedRecords[deletedRecords.length - 1];
    setDeletedRecords(prev => prev.slice(0, -1));
    
    // To "restore", we essentially re-create it because the original ID might be gone
    // Or if we implemented soft-delete we could restore.
    // Since we did hard delete, we have to create a new one with the same data.
    
    const { id, user_id, created_at, updated_at, ...inputData } = recordToRestore;
    
    try {
      await experimentService.createRecord(inputData);
      setError(null);
    } catch (err) {
      console.error('Failed to restore record:', err);
      setError('Failed to restore record.');
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading experiments...</p>
        </div>
      </div>
    );
  }

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
              {records.length} {records.length === 1 ? 'record' : 'records'} stored in cloud
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

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

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
