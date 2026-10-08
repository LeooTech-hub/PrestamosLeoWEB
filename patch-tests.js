const fs = require('fs');
let content = fs.readFileSync('tests/moneyMethods-ui.test.cjs', 'utf8');

content = content.replace(
  /const Component = require\(path\.join\(project, 'src\/components\/Clients\/EditLoanModal\.tsx'\)\)\.EditLoanModal;/g,
  "const Component = require(path.join(project, 'frontend/src/components/EditLoanModal.jsx')).EditLoanModal;"
);

fs.writeFileSync('tests/moneyMethods-ui.test.cjs', content);
console.log('Tests patched!');
