
import React from 'react';
import { ReceiptData } from '../types';

interface ReceiptDisplayProps {
  data: ReceiptData;
  imageElement?: React.ReactNode;
}

export const ReceiptDisplay: React.FC<ReceiptDisplayProps> = ({ data, imageElement }) => {
  return (
    <div className="space-y-8">
      {/* Top Section: Metadata Grid */}
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Merchant</label>
            <p className="text-lg font-black text-slate-900 leading-tight">{data.merchantName}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
            <p className="text-lg font-bold text-slate-700">{data.date}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</label>
            <p className="text-2xl font-black text-blue-600">{data.currency} {data.totalAmount.toFixed(2)}</p>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Language</label>
            <div>
              <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-1 rounded-full uppercase">
                {data.originalLanguage || 'Detected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Image + Items Table Side-by-Side */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Narrow Image Slot (passed from parent) */}
        {imageElement && (
          <div className="w-full lg:w-32 shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-1">Source</h3>
            {imageElement}
          </div>
        )}

        {/* Right: Items Table with Scrollable Body and Fixed Summary */}
        <div className="flex-1 min-w-0 w-full flex flex-col">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-1">Extracted Items</h3>
          
          <div className="flex flex-col border border-slate-200 rounded-2xl shadow-lg bg-white overflow-hidden">
            {/* Scrollable Container for Table - max-h-64 is approx 256px, ideal for 4-5 items */}
            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <table className="min-w-full divide-y divide-slate-200 border-separate border-spacing-0">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border-b border-slate-200">Item (EN)</th>
                    <th className="px-2 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border-b border-slate-200">Qty</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border-b border-slate-200">Price</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border-b border-slate-200">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {data.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">{item.translatedName}</div>
                        {item.translatedName !== item.originalName && (
                          <div className="text-[10px] text-slate-400 font-medium italic mt-0.5">Orig: {item.originalName}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-right text-sm text-slate-600 font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600 font-medium">{item.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm font-black text-slate-900">{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Always Visible Summary Footer - Pinned to the bottom of the card */}
            <div className="bg-slate-900 text-white p-5 px-6 flex justify-between items-center shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-0.5">Summary</span>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{data.items.length} Lines Processed</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Total Amount</span>
                <span className="text-2xl font-black text-white tracking-tighter flex items-baseline">
                  <span className="text-xs mr-1.5 font-bold text-blue-400">{data.currency}</span>
                  {data.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <p className="mt-3 px-1 text-[9px] text-slate-400 italic font-medium flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            Scroll inside the table above for full item list
          </p>
        </div>
      </div>
    </div>
  );
};
