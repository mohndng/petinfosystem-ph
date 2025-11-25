import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, Search, X, Check, Loader2 } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  name?: string; // For form data compatibility
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  loading = false,
  required = false,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedLabel = options.find(o => o.value === value)?.label;

  // Handle selection
  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Hidden input for native form submission compatibility */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(true)}
        disabled={disabled || loading}
        className={`
          w-full flex items-center justify-between px-3 py-3 border rounded-xl text-left transition-all
          ${disabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 focus:ring-2 focus:ring-blue-100'}
        `}
      >
        <span className={`text-sm truncate ${!value ? 'text-slate-400' : 'font-medium'}`}>
          {loading ? 'Loading data...' : (selectedLabel || placeholder)}
        </span>
        <div className="ml-2 text-slate-400 flex-shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-300">
            
            {/* Header */}
            <div className="bg-[#1e293b] px-4 py-4 flex items-center justify-between shrink-0">
              <h3 className="text-white font-bold text-lg tracking-tight">Select {label}</h3>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar (Only show if options > 5) */}
            {options.length > 5 && (
              <div className="p-3 border-b border-slate-100 bg-slate-50 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 flex-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all group
                        ${isSelected 
                          ? 'bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-100' 
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}
                      `}
                    >
                      <span>{opt.label}</span>
                      <div className={`
                        w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                        ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 group-hover:border-slate-400'}
                      `}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No results found for "{searchTerm}"
                </div>
              )}
            </div>
            
            {/* Footer Tip */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
               <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tap an option to select</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};