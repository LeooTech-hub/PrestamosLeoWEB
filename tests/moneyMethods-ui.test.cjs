const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.localStorage = dom.window.localStorage;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.alert = () => {};
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;
const project = path.resolve(__dirname, '..');
const load = Module._load;
Module._load = function(request, parent, main) {
  if (request.startsWith('@/')) request = path.join(project, 'src', request.slice(2));
  if (request === 'react' || request.startsWith('react/') || request === 'lucide-react') return load.call(this, request, module, main);
  if (request === 'canvas-confetti') return () => {};
  // Routing is outside this test's scope; the form stays on its current page.
  if (request === 'react-router-dom') return { useNavigate: () => () => {}, useLocation: () => ({ state: null }) };
  return load.call(this, request, parent, main);
};
function compile(mod, filename) {
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8').replaceAll('import.meta.env', '({})'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText, filename);
}
require.extensions['.jsx'] = compile;
require.extensions['.tsx'] = compile;
require.extensions['.ts'] = compile;
require.extensions['.mjs'] = compile;
const oldJs = require.extensions['.js'];
require.extensions['.js'] = (mod, filename) => /[\\/]frontend[\\/]src[\\/]/.test(filename) ? compile(mod, filename) : oldJs(mod, filename);

const loan = { id: 'l1', clientId: 'c1', clientName: 'Ana', clientPhone: '999999999',
  capital: 100, interestAmount: 20, totalToPay: 120, dailyPaymentAmount: 6,
  remainingAmount: 120, paymentDays: 20, startDate: '2026-10-01', dueDate: '2026-10-21', status: 'ACTIVE' };
const client = { id: 'c1', name: 'Ana', phone: '999999999', address: 'Lima' };
async function mount(t, Component, props) {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(React.createElement(Component, props)));
  host.rerender = async nextProps => { await act(async () => root.render(React.createElement(Component, nextProps))); };
  t.after(async () => { await act(async () => root.unmount()); host.remove(); });
  return host;
}
const button = (host, text) => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text);
async function click(el) { assert.ok(el, 'Expected button exists'); await act(async () => el.click()); }
async function input(el, value) {
  assert.ok(el, 'Expected input exists');
  await act(async () => {
    Object.getOwnPropertyDescriptor(el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
    el.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
}
async function submit(host) { await act(async () => host.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))); }

for (const [filename, name] of [
  ['frontend/src/components/LoanConstanciaModal.jsx', 'LoanConstanciaModal'],
  ['src/components/Modals/LoanConstanciaModal.tsx', 'LoanConstanciaModal'],
]) {
  const Component = require(path.join(project, filename))[name];
  for (const [method, label] of [['YAPE', 'Yape'], ['CASH', 'Efectivo'], [undefined, 'No registrado']]) {
    test(`${filename}: receipt, copy and WhatsApp share saved ${label}`, async t => {
      let copied; let opened;
      navigator.clipboard = { writeText: async value => { copied = value; } };
      window.open = value => { opened = value; };
      const host = await mount(t, Component, { isOpen: true, onClose() {}, loan: { ...loan, disbursement_method: method, payment_method: 'YAPE' } });
      assert.ok(host.textContent.includes('Préstamo efectuado en:'));
      const preview = [...host.querySelectorAll('div')].find(el => el.className.includes('whitespace-pre-wrap'));
      assert.ok(preview.textContent.includes(`*Préstamo efectuado en:* ${label}`));
      await click(button(host, 'Copiar Texto'));
      await click(button(host, 'Enviar por WhatsApp'));
      assert.equal(copied, preview.textContent);
      assert.equal(new URL(opened).searchParams.get('text'), preview.textContent);
    });
  }
}

for (const filename of ['frontend/src/components/PaymentModal.jsx', 'src/components/DailyRoute/PaymentModal.tsx']) {
  const Component = require(path.join(project, filename)).PaymentModal;
  for (const [method, label] of [['YAPE', 'Yape'], ['CASH', 'Efectivo']]) {
  test(`${filename}: requires explicit method and sends ${label} separately from disbursement`, async t => {
    const calls = [];
    const host = await mount(t, Component, { loan: { ...loan, disbursement_method: 'CASH' }, isOpen: true, onClose() {},
      onConfirmPayment: async (...args) => { calls.push(args); return { payment: { id: 'p1', amount: 6 }, updatedLoan: loan }; } });
    const confirm = () => [...host.querySelectorAll('button')].find(b => /Confirmar (Cobro|Pago)/.test(b.textContent));
    await click(confirm()); assert.equal(calls.length, 0);
    assert.ok(host.textContent.includes('Selecciona el método de pago'));
    await click(button(host, label)); await click(confirm());
    assert.equal(calls[0][4], method);
  });
  }
}

for (const filename of ['frontend/src/components/PaymentModal.jsx', 'src/components/DailyRoute/PaymentModal.tsx']) {
  test(`${filename}: reopening after success starts a fresh payment with no chosen method`, async t => {
    const Component = require(path.join(project, filename)).PaymentModal;
    const props = { loan, isOpen: true, onClose() {}, onConfirmPayment: async () => ({ payment: { id: 'p1', amount: 6 }, updatedLoan: loan }) };
    const host = await mount(t, Component, props);
    await click(button(host, 'Yape'));
    await click([...host.querySelectorAll('button')].find(b => /Confirmar (Cobro|Pago)/.test(b.textContent)));
    await host.rerender({ ...props, isOpen: false });
    await host.rerender(props);
    assert.ok(button(host, 'Efectivo'), 'The next payment must show the method selector');
    assert.equal(host.querySelectorAll('[role=radio][aria-checked=true]').length, 0);
  });
}

for (const [filename, exportName, selection] of [
  ['frontend/src/components/QuickCreateLoanModal.jsx', 'QuickCreateLoanModal', 'select'],
  ['src/components/Modals/QuickCreateLoanModal.tsx', 'QuickCreateLoanModal', 'search'],
  ['src/components/LoanCalculator/CalculatorView.tsx', 'CalculatorView', 'select'],
]) {
  test(`${filename}: loan requires an explicit delivery choice and passes the chosen method`, async t => {
    const Component = require(path.join(project, filename))[exportName];
    const calls = [];
    const props = { clients: [client], isOpen: true, onClose() {}, onRedirectToNewClient() {}, onSubmitLoan: async data => { calls.push(data); } };
    const host = await mount(t, Component, props);
    if (selection === 'select') await input(host.querySelector('select'), 'c1');
    else {
      await input(host.querySelector('input'), 'Ana');
      await click([...host.querySelectorAll('strong')].find(el => el.textContent === 'Ana').parentElement.parentElement);
    }
    await submit(host); assert.equal(calls.length, 0);
    assert.ok(host.textContent.includes('Selecciona el método de entrega'));
    assert.equal(host.querySelectorAll('[role=radio][aria-checked=true]').length, 0);
    await click(button(host, 'Efectivo')); await submit(host);
    assert.equal(calls[0].disbursementMethod, 'CASH');
    if (filename.includes('QuickCreateLoanModal')) {
      await host.rerender({ ...props, isOpen: false }); await host.rerender(props);
      assert.equal(host.querySelectorAll('[role=radio][aria-checked=true]').length, 0);
    }
  });
}

for (const filename of ['frontend/src/components/EditPaymentModal.jsx', 'src/components/Modals/EditPaymentModal.tsx']) {
  test(`${filename}: historical edit keeps missing method and stored date until explicitly selected`, async t => {
    const Component = require(path.join(project, filename)).EditPaymentModal;
    const calls = [];
    const host = await mount(t, Component, { isOpen: true, onClose() {}, payment: { id: 'old', amount: 80, date: '2024-03-16' },
      onConfirmEditPayment: async (...args) => { calls.push(args); } });
    assert.ok(host.textContent.includes('No registrado'));
    await submit(host);
    assert.equal(calls[0][1].paymentMethod, undefined);
    assert.equal(calls[0][1].date, '2024-03-16');
    await click(button(host, 'Yape')); await submit(host);
    assert.equal(calls[1][1].paymentMethod, 'YAPE');
  });
}

test('new client form blocks without delivery method, updates summary, and sends both choices', async t => {
  const Component = require(path.join(project, 'frontend/src/pages/VistaNuevoCliente.jsx')).VistaNuevoCliente;
  const calls = [];
  const host = await mount(t, Component, { clients: [client], onSubmitLoan: async body => { calls.push(body); return { loan }; } });
  await input(host.querySelector('select'), 'c1');
  await input(host.querySelector('input[type=number]'), '100');
  await submit(host); assert.equal(calls.length, 0);
  assert.ok(host.textContent.includes('Selecciona el método de entrega'));
  await click(button(host, 'Yape')); assert.ok(host.textContent.includes('Método de entrega:'));
  await submit(host); assert.equal(calls[0].disbursementMethod, 'YAPE');
  await click(button(host, 'Efectivo')); await submit(host);
  assert.equal(calls[1].disbursementMethod, 'CASH');
});

test('history shows loan start, stored payment date, amount, methods and combines search/quick filters', async t => {
  const api = require(path.join(project, 'frontend/src/api.js')).default;
  const original = api.get;
  api.get = async url => ({ data: url.includes('collectors') ? [] : [
    { id: 'p1', client_name: 'Ana', loan_start_date: '2026-10-01', payment_date: '2026-10-06', created_at: '2026-10-07T03:00:00Z', amount: 80, payment_method: 'YAPE' },
    { id: 'p2', client_name: 'Luis', loan_start_date: '2026-09-17', payment_date: '2026-10-06', amount: 360, payment_method: 'CASH' },
    { id: 'p3', client_name: 'Antiguo', amount: 20 },
  ] });
  t.after(() => { api.get = original; });
  const Component = require(path.join(project, 'frontend/src/pages/VistaCobros.jsx')).VistaCobros;
  const host = await mount(t, Component, { user: { role: 'ADMIN' } });
  assert.ok(host.textContent.includes('Día de Inicio'));
  assert.ok(host.textContent.includes('01/10/2026'));
  assert.ok(host.textContent.includes('06/10/2026'));
  assert.ok(host.textContent.includes('80.00'));
  assert.ok(host.textContent.includes('No registrado'));
  await click(button(host, 'Yape'));
  assert.ok(host.textContent.includes('Ana')); assert.ok(!host.textContent.includes('Luis'));
  await input(host.querySelector('input[type=text]'), 'Luis');
  assert.ok(!host.textContent.includes('Ana'));
  await click(button(host, 'Efectivo'));
  assert.ok(host.textContent.includes('Luis')); assert.ok(host.textContent.includes('360.00'));
  await input(host.querySelector('input[type=text]'), ''); await click(button(host, 'Todos'));
  assert.ok(host.textContent.includes('Antiguo'));
});

test('history retains date and collector filters while combining method, search and totals', async t => {
  const api = require(path.join(project, 'frontend/src/api.js')).default;
  const original = api.get;
  const requests = [];
  const rows = [
    { id: 'one', client_name: 'Ana', payment_date: '2026-10-06', amount: 80, payment_method: 'YAPE', collected_by_user_id: 'admin' },
    { id: 'two', client_name: 'Otro', payment_date: '2026-10-06', amount: 40, payment_method: 'YAPE', collected_by_user_id: 'other' },
    { id: 'three', client_name: 'Luis', payment_date: '2026-10-06', amount: 360, payment_method: 'CASH', collected_by_user_id: 'admin' },
    { id: 'four', client_name: 'Posterior', payment_date: '2026-10-07', amount: 30, payment_method: 'YAPE', collected_by_user_id: 'admin' },
  ];
  api.get = async url => {
    if (url.includes('collectors')) return { data: [{ id: 'admin', name: 'Admin' }, { id: 'other', name: 'Other' }] };
    requests.push(url);
    const query = new URLSearchParams(url.split('?')[1]);
    return { data: rows.filter(row => (!query.get('start_date') || row.payment_date >= query.get('start_date'))
      && (!query.get('end_date') || row.payment_date <= query.get('end_date'))
      && (!query.get('collector_id') || row.collected_by_user_id === query.get('collector_id'))) };
  };
  t.after(() => { api.get = original; });
  const Component = require(path.join(project, 'frontend/src/pages/VistaCobros.jsx')).VistaCobros;
  const host = await mount(t, Component, { user: { role: 'ADMIN' } });
  const dates = host.querySelectorAll('input[type=date]');
  await input(dates[0], '2026-10-01'); await input(dates[1], '2026-10-06');
  await input(host.querySelector('select'), 'admin');
  await click(button(host, 'Yape'));
  assert.ok(host.textContent.includes('Ana'));
  assert.ok(!host.textContent.includes('Otro')); assert.ok(!host.textContent.includes('Posterior'));
  assert.ok(!host.textContent.includes('Luis')); assert.ok(host.textContent.includes('1 cobro'));
  assert.ok(host.textContent.includes('80.00'));
  await input(host.querySelector('input[type=text]'), 'Luis');
  assert.ok(host.textContent.includes('0 cobros'));
  await click(button(host, 'Efectivo')); await click(button(host, 'Aplicar'));
  assert.ok(host.textContent.includes('Luis')); assert.ok(host.textContent.includes('360.00'));
  const last = new URLSearchParams(requests.at(-1).split('?')[1]);
  assert.equal(last.get('start_date'), '2026-10-01');
  assert.equal(last.get('end_date'), '2026-10-06');
  assert.equal(last.get('collector_id'), 'admin');
});

test('EditLoanModal: historical edit keeps missing method until explicitly selected', async t => {
  const Component = require(path.join(project, 'frontend/src/components/EditLoanModal.jsx')).EditLoanModal;
  const calls = [];
  const host = await mount(t, Component, {
    isOpen: true,
    onClose() {},
    loan: { id: 'old', capital: 100, startDate: '2026-10-01' },
    onConfirmEditLoan: async (...args) => { calls.push(args); }
  });
  
  assert.ok(host.textContent.includes('No registrado'), 'Should show No registrado for historical loan');
  await submit(host);
  assert.equal(calls[0][1].disbursementMethod, undefined);

  await click(button(host, 'Yape'));
  await submit(host);
  assert.equal(calls[1][1].disbursementMethod, 'YAPE');
});

test('EditLoanModal: loads existing method correctly and updates it', async t => {
  const Component = require(path.join(project, 'frontend/src/components/EditLoanModal.jsx')).EditLoanModal;
  const calls = [];
  const host = await mount(t, Component, {
    isOpen: true,
    onClose() {},
    loan: { id: 'l1', capital: 100, startDate: '2026-10-01', disbursementMethod: 'CASH' },
    onConfirmEditLoan: async (...args) => { calls.push(args); }
  });
  
  assert.ok(host.textContent.includes('Efectivo'), 'Should show Efectivo');
  assert.equal(host.querySelectorAll('[role=radio][aria-checked=true]').length, 1);
  await submit(host);
  assert.equal(calls[0][1].disbursementMethod, 'CASH');

  await click(button(host, 'Yape'));
  await submit(host);
  assert.equal(calls[1][1].disbursementMethod, 'YAPE');
});
