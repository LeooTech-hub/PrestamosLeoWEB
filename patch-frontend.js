const fs = require('fs');
let content = fs.readFileSync('src/components/Clients/EditLoanModal.tsx', 'utf8');

content = content.replace(
  "import { Loan } from '@/types';",
  "import { Loan, MoneyMethod } from '@/types';\nimport { MoneyMethodSelector } from '@/components/MoneyMethodSelector';"
);

content = content.replace(
  /notes\?:\s*string;\s*}/,
  "notes?: string;\n      disbursementMethod?: MoneyMethod;\n      disbursement_method?: MoneyMethod;\n    }"
);

content = content.replace(
  /const \[notes,\s*setNotes\]\s*=\s*useState<string>\(loan\?\.notes\s*\|\|\s*''\);/,
  "const [notes, setNotes] = useState<string>(loan?.notes || '');\n  const [disbursementMethod, setDisbursementMethod] = useState<MoneyMethod | ''>(\n    loan?.disbursementMethod || loan?.disbursement_method || ''\n  );"
);

content = content.replace(
  /setNotes\(loan\.notes \|\| ''\);/,
  "setNotes(loan.notes || '');\n    setDisbursementMethod(loan.disbursementMethod || loan.disbursement_method || '');"
);

content = content.replace(
  /notes:\s*notes\.trim\(\),?\s*}\);/,
  "notes: notes.trim(),\n        disbursementMethod: disbursementMethod || undefined,\n        disbursement_method: disbursementMethod || undefined,\n      });"
);

const uiTarget = "{/* ── Fechas: Inicio + Vencimiento (ambas editables) ── */}";
const uiReplacement = `{/* ── Método de entrega ── */}
          <div className="mb-4">
            <MoneyMethodSelector
              label={disbursementMethod ? "Método de entrega del préstamo:" : "Método de entrega: No registrado"}
              value={disbursementMethod}
              onChange={(val) => setDisbursementMethod(val)}
            />
          </div>

          {/* ── Fechas: Inicio + Vencimiento (ambas editables) ── */}`;
content = content.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/components/Clients/EditLoanModal.tsx', content);
console.log('Frontend patched!');
