
import React, { useState, useEffect } from 'react';
import { AppStatus, ReceiptData, RECEIPT_CATEGORIES, FROM_ACCOUNT_OPTIONS, PAID_BY_OPTIONS, ProcessedReceipt } from './types';
import { processReceiptWithGemini } from './services/geminiService';
import { ReceiptDisplay } from './components/ReceiptDisplay';
import { FileUpload } from './components/FileUpload';

// Helper component for Editable Dropdowns
const ValidatedComboBox: React.FC<{
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  onAddNew: (val: string) => void;
  disabled?: boolean;
}> = ({ label, value, options, onSelect, onAddNew, disabled }) => {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    
    const exists = options.some(opt => opt.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError(`"${trimmed}" already exists in the list.`);
      return;
    }

    onAddNew(trimmed);
    onSelect(trimmed);
    setIsAddingCustom(false);
    setCustomValue('');
    setError(null);
  };

  if (isAddingCustom) {
    return (
      <div className="flex flex-col gap-1 min-w-[180px]">
        <label className="text-[10px] font-bold text-slate-400 uppercase">{label}</label>
        <div className="flex gap-1">
          <input
            autoFocus
            type="text"
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="New value..."
            className={`flex-1 bg-white border ${error ? 'border-red-500' : 'border-blue-400'} text-sm rounded-lg p-2 outline-none shadow-sm`}
          />
          <button 
            onClick={handleAdd}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50"
            disabled={!customValue.trim()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          </button>
          <button 
            onClick={() => { setIsAddingCustom(false); setError(null); }}
            className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {error && <span className="text-[10px] text-red-500 font-medium">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <label className="text-[10px] font-bold text-slate-400 uppercase">{label}</label>
      <select 
        value={value}
        onChange={(e) => {
          if (e.target.value === '___ADD_NEW___') {
            setIsAddingCustom(true);
          } else {
            onSelect(e.target.value);
          }
        }}
        disabled={disabled}
        className={`bg-white border text-sm rounded-lg p-2 shadow-sm focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-colors ${
          value === "" ? "border-slate-300 italic text-slate-400" : "border-slate-300 text-slate-900"
        }`}
      >
        <option value="" disabled>Select {label}...</option>
        {options.map(opt => (
          <option key={opt} value={opt} className="not-italic text-slate-900">{opt}</option>
        ))}
        <option value="___ADD_NEW___" className="font-bold text-blue-600 not-italic">+ Add Custom...</option>
      </select>
    </div>
  );
};

const App: React.FC = () => {
  const [receipts, setReceipts] = useState<ProcessedReceipt[]>([]);
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<string[]>(RECEIPT_CATEGORIES);
  const [accounts, setAccounts] = useState<string[]>(FROM_ACCOUNT_OPTIONS);
  const [paidByList, setPaidByList] = useState<string[]>(PAID_BY_OPTIONS);

  const activeReceipt = receipts.find(r => r.id === activeReceiptId);

  const handleFilesUpload = async (files: FileList) => {
    const newReceipts: ProcessedReceipt[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = Math.random().toString(36).substr(2, 9);
      const previewUrl = URL.createObjectURL(file);
      
      const newEntry: ProcessedReceipt = {
        id,
        status: AppStatus.PROCESSING,
        data: null,
        error: null,
        previewUrl,
        selectedCategory: "", 
        selectedFromAccount: "", 
        selectedPaidBy: "", 
        isConfirmed: false
      };
      
      newReceipts.push(newEntry);
      processFile(id, file);
    }

    setReceipts(prev => [...prev, ...newReceipts]);
    if (!activeReceiptId && newReceipts.length > 0) {
      setActiveReceiptId(newReceipts[0].id);
    }
  };

  const processFile = async (id: string, file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
          const data = await processReceiptWithGemini(base64Data, file.type);
          updateReceipt(id, { status: AppStatus.COMPLETED, data });
        } catch (err: any) {
          updateReceipt(id, { status: AppStatus.ERROR, error: err.message || 'Processing failed' });
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      updateReceipt(id, { status: AppStatus.ERROR, error: 'Failed to read file' });
    }
  };

  const updateReceipt = (id: string, updates: Partial<ProcessedReceipt>) => {
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleConfirm = (id: string) => {
    updateReceipt(id, { isConfirmed: true });
  };

  const handleReset = () => {
    receipts.forEach(r => URL.revokeObjectURL(r.previewUrl));
    setReceipts([]);
    setActiveReceiptId(null);
  };

  const exportAllConfirmed = () => {
    const confirmed = receipts.filter(r => r.isConfirmed && r.data);
    if (confirmed.length === 0) return;

    const headers = ['Month', 'Date', 'Type', 'Item', 'Vendor', 'Amount', 'From Account', 'Paid by'];
    const rows: any[] = [];

    confirmed.forEach((r) => {
      const data = r.data!;
      const dateParts = data.date.split('-');
      const month = dateParts.length >= 2 ? `${dateParts[0]}${dateParts[1]}` : '';
      const itemSummary = data.items.map(i => i.translatedName).join(', ');

      rows.push([
        `"${month}"`,
        `"${data.date}"`,
        `"${r.selectedCategory}"`,
        `"${itemSummary.replace(/"/g, '""')}"`,
        `"${data.merchantName.replace(/"/g, '""')}"`,
        data.totalAmount,
        `"${r.selectedFromAccount}"`,
        `"${r.selectedPaidBy}"`
      ]);
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `receipts_summary_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const ZoomableReceiptImage = ({ url }: { url: string }) => (
    <div className="sticky top-4 z-40 group cursor-zoom-in">
      <div className="relative">
        <img 
          src={url} 
          className="rounded-2xl border border-slate-200 shadow-md w-full h-auto object-contain max-h-[160px] bg-slate-50 transition-all duration-300 ease-in-out group-hover:scale-[2.8] group-hover:shadow-2xl group-hover:z-50 group-hover:relative origin-top-left ring-1 ring-slate-200" 
        />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 pointer-events-none"></div>
      </div>
      <p className="text-[9px] text-slate-400 mt-2 italic font-bold tracking-tight group-hover:opacity-0 transition-opacity">Hover to zoom</p>
    </div>
  );

  const confirmedCount = receipts.filter(r => r.isConfirmed).length;

  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8 bg-slate-100">
      <header className="w-full max-w-6xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-black text-blue-700 tracking-tight">Tony Receipt OCR App</h1>
        
        {confirmedCount > 0 && (
           <button 
            onClick={exportAllConfirmed}
            className="px-6 py-3 bg-emerald-600 text-white font-black rounded-xl shadow-lg hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             <div className="text-left leading-tight">
                <p className="text-xs uppercase">Export CSV</p>
                <p className="text-[9px] opacity-80 uppercase font-bold tracking-widest">{confirmedCount} Records</p>
             </div>
           </button>
        )}
      </header>

      <main className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[480px]">
        {/* Sidebar Gallery */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex flex-col p-5">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Queue</h2>
          <div className="flex-1 overflow-y-auto space-y-3 pb-4 scrollbar-hide">
            {receipts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <svg className="w-6 h-6 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-[10px] text-slate-400 font-medium">Empty</p>
              </div>
            )}
            {receipts.map(r => (
              <button
                key={r.id}
                onClick={() => setActiveReceiptId(r.id)}
                className={`w-full relative group p-1 rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                  activeReceiptId === r.id ? 'border-blue-500 bg-white shadow-lg scale-[1.02]' : 'border-transparent hover:bg-slate-200'
                }`}
              >
                <img src={r.previewUrl} className="w-full h-20 object-cover rounded-lg opacity-80 group-hover:opacity-100" />
                {r.status === AppStatus.PROCESSING && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                )}
                {r.isConfirmed && (
                  <div className="absolute top-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow ring-1 ring-white">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                  </div>
                )}
              </button>
            ))}
            
            <button 
              onClick={() => setActiveReceiptId(null)}
              className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
              <span className="text-[9px] font-black uppercase tracking-widest">Add</span>
            </button>
          </div>
          
          {receipts.length > 0 && (
            <button 
              onClick={handleReset} 
              className="mt-4 text-[10px] font-black text-red-500 hover:text-red-700 transition-colors pt-3 border-t border-slate-200 flex items-center justify-center gap-2"
            >
              RESET ALL
            </button>
          )}
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-6 md:p-8 flex-1 overflow-y-auto scrollbar-hide">
            {!activeReceiptId ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-full max-w-lg">
                  <FileUpload onFilesSelect={handleFilesUpload} />
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {activeReceipt?.status === AppStatus.PROCESSING && (
                  <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    <p className="text-xl font-black text-slate-800">Analyzing...</p>
                  </div>
                )}

                {activeReceipt?.status === AppStatus.ERROR && (
                  <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-red-700 text-center">
                    <p className="font-black mb-2">Extraction Failed</p>
                    <p className="text-xs">{activeReceipt.error}</p>
                    <button onClick={() => updateReceipt(activeReceipt.id, { status: AppStatus.PROCESSING })} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">Retry</button>
                  </div>
                )}

                {activeReceipt?.status === AppStatus.COMPLETED && activeReceipt.data && (
                  <ReceiptDisplay 
                    data={activeReceipt.data} 
                    imageElement={<ZoomableReceiptImage url={activeReceipt.previewUrl} />}
                  />
                )}
              </div>
            )}
          </div>

          {activeReceipt?.status === AppStatus.COMPLETED && (
            <div className="bg-slate-50 p-4 border-t border-slate-200">
              <div className="flex flex-col xl:flex-row gap-4 justify-between items-end">
                <div className="flex flex-wrap items-start gap-4 w-full xl:w-auto">
                  <ValidatedComboBox 
                    label="Type"
                    value={activeReceipt.selectedCategory}
                    options={categories}
                    onSelect={(val) => updateReceipt(activeReceipt.id, { selectedCategory: val })}
                    onAddNew={(val) => setCategories(prev => [...prev, val].sort())}
                    disabled={activeReceipt.isConfirmed}
                  />
                  <ValidatedComboBox 
                    label="Account"
                    value={activeReceipt.selectedFromAccount}
                    options={accounts}
                    onSelect={(val) => updateReceipt(activeReceipt.id, { selectedFromAccount: val })}
                    onAddNew={(val) => setAccounts(prev => [...prev, val].sort())}
                    disabled={activeReceipt.isConfirmed}
                  />
                  <ValidatedComboBox 
                    label="By"
                    value={activeReceipt.selectedPaidBy}
                    options={paidByList}
                    onSelect={(val) => updateReceipt(activeReceipt.id, { selectedPaidBy: val })}
                    onAddNew={(val) => setPaidByList(prev => [...prev, val])}
                    disabled={activeReceipt.isConfirmed}
                  />
                </div>

                <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                  {!activeReceipt.isConfirmed ? (
                    <>
                      <button 
                        disabled={!activeReceipt.selectedCategory || !activeReceipt.selectedFromAccount || !activeReceipt.selectedPaidBy}
                        onClick={() => handleConfirm(activeReceipt.id)}
                        className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                      >
                        CONFIRM
                      </button>
                      {(!activeReceipt.selectedCategory || !activeReceipt.selectedFromAccount || !activeReceipt.selectedPaidBy) && (
                        <span className="text-[8px] text-slate-400 font-bold uppercase text-center tracking-tighter">Required Fields</span>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-4 bg-emerald-100/50 px-4 py-2 rounded-xl border border-emerald-200">
                      <span className="text-xs font-black text-emerald-700 uppercase">Verified</span>
                      <button onClick={() => updateReceipt(activeReceipt.id, { isConfirmed: false })} className="text-[10px] font-bold text-slate-400 hover:text-blue-600 underline">Edit</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
