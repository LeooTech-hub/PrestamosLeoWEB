import React from 'react';
import { Check } from 'lucide-react';

export function MoneyMethodSelector({ label, value, onChange, error }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-bold text-[#6E615A] dark:text-[#C2B29F]">{label}</legend>
      <div role="radiogroup" aria-label={label} aria-required="true" className="grid grid-cols-2 gap-2">
        {[['YAPE', 'Yape'], ['CASH', 'Efectivo']].map(([method, text]) => (
          <button key={method} type="button" role="radio" aria-checked={value === method}
            onClick={() => onChange(method)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${value === method
              ? 'terracotta-gradient text-white border-transparent'
              : 'bg-[#FAF8F5] dark:bg-[#24211E] text-[#2C221E] dark:text-[#F3F4F6] border-[#E6DCD2] dark:border-[#332F2C]'}`}>
            {value === method && <Check aria-hidden="true" className="w-4 h-4" />}{text}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-xs font-semibold text-[#C84B31]">{error}</p>}
    </fieldset>
  );
}
