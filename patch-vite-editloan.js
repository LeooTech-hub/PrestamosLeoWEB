const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/EditLoanModal.jsx', 'utf8');

const importTarget = "import { X, Calendar, FileText, CheckCircle2, Calculator, Percent } from 'lucide-react';";
const importReplacement = "import { X, Calendar, FileText, CheckCircle2, Calculator, Percent } from 'lucide-react';\nimport { MoneyMethodSelector } from './MoneyMethodSelector';";
content = content.replace(importTarget, importReplacement);

const stateTarget = "const [notes, setNotes] = useState('');";
const stateReplacement = "const [notes, setNotes] = useState('');\n  const [disbursementMethod, setDisbursementMethod] = useState('');";
content = content.replace(stateTarget, stateReplacement);

const effectTarget = "setNotes(loan.notes || '');";
const effectReplacement = "setNotes(loan.notes || '');\n        setDisbursementMethod(loan.disbursementMethod || loan.disbursement_method || '');";
content = content.replace(effectTarget, effectReplacement);

const submitTarget = "notes: notes || undefined,";
const submitReplacement = "notes: notes || undefined,\n        disbursementMethod: disbursementMethod || undefined,\n        disbursement_method: disbursementMethod || undefined,";
content = content.replace(submitTarget, submitReplacement);

const uiTarget = "{/* Fechas: Inicio y Vencimiento */}";
const uiReplacement = `<div className="mb-4">
            <MoneyMethodSelector
              label={disbursementMethod ? "Método de entrega del préstamo:" : "Método de entrega: No registrado"}
              value={disbursementMethod}
              onChange={(val) => setDisbursementMethod(val)}
            />
          </div>

          {/* Fechas: Inicio y Vencimiento */}`;
content = content.replace(uiTarget, uiReplacement);

fs.writeFileSync('frontend/src/components/EditLoanModal.jsx', content);
console.log('Done!');
