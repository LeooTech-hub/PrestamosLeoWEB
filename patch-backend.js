const fs = require('fs');
let content = fs.readFileSync('backend/src/controllers/loanController.js', 'utf8');

const target1 = "          notes = $14::text,\r\n          status = CASE";
const target1b = "          notes = $14::text,\n          status = CASE";

const replacement1 = "          notes = $14::text,\n          disbursement_method = $20::text,\n          status = CASE";

const target2 = "        remainingAmount, status, dueDate, String(id), paymentFrequency\r\n      ]);";
const target2b = "        remainingAmount, status, dueDate, String(id), paymentFrequency\n      ]);";

const replacement2 = "        remainingAmount, status, dueDate, String(id), paymentFrequency, disbursementMethod\n      ]);";

const target3 = "      const notes = String(req.body.notes ?? req.body.observaciones ?? current.notes ?? '').trim();";
const replacement3 = "      const notes = String(req.body.notes ?? req.body.observaciones ?? current.notes ?? '').trim();\n      const disbursementMethod = req.body.disbursement_method ?? req.body.disbursementMethod ?? current.disbursement_method ?? null;";

if (content.includes(target1)) content = content.replace(target1, replacement1);
else if (content.includes(target1b)) content = content.replace(target1b, replacement1);
else console.log("target1 not found");

if (content.includes(target2)) content = content.replace(target2, replacement2);
else if (content.includes(target2b)) content = content.replace(target2b, replacement2);
else console.log("target2 not found");

if (!content.includes("disbursementMethod = req.body.disbursement_method")) {
    content = content.replace(target3, replacement3);
}

fs.writeFileSync('backend/src/controllers/loanController.js', content);
console.log('Backend patched!');
