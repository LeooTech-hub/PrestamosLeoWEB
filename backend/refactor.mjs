import fs from 'fs';
import parser from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';

const traverse = _traverse.default;
const generate = _generate.default;

const code = fs.readFileSync('src/controllers/loanController.js', 'utf8');

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx', 'importAssertions']
});

traverse(ast, {
  CallExpression(path) {
    const callee = path.node.callee;
    if (callee.type === 'MemberExpression' &&
        (callee.object.name === 'pool' || callee.object.name === 'client') &&
        (callee.property.name === 'query' || callee.property.name === 'execute')) {
      
      // Change 'execute' to 'query'
      callee.property.name = 'query';

      const firstArg = path.node.arguments[0];
      let counter = 1;

      if (firstArg && firstArg.type === 'StringLiteral') {
        firstArg.value = firstArg.value.replace(/\?/g, () => `$${counter++}`);
      } else if (firstArg && firstArg.type === 'TemplateLiteral') {
        for (const quasi of firstArg.quasis) {
          quasi.value.raw = quasi.value.raw.replace(/\?/g, () => `$${counter++}`);
          quasi.value.cooked = quasi.value.raw; // Simplified, fine for this use case
        }
      }
    }
  },
  VariableDeclarator(path) {
    const { id, init } = path.node;
    if (id.type === 'ArrayPattern' && init && init.type === 'AwaitExpression') {
      const argument = init.argument;
      if (argument && argument.type === 'CallExpression' && argument.callee.type === 'MemberExpression') {
        const objName = argument.callee.object.name;
        const propName = argument.callee.property.name;
        if ((objName === 'pool' || objName === 'client') && (propName === 'query' || propName === 'execute')) {
          // Convert const [r] = ... to const { rows: r } = ...
          const firstElement = id.elements[0];
          if (firstElement && firstElement.type === 'Identifier') {
            path.node.id = {
              type: 'ObjectPattern',
              properties: [
                {
                  type: 'ObjectProperty',
                  key: { type: 'Identifier', name: 'rows' },
                  value: firstElement, // e.g., 'r' or 'rows'
                  computed: false,
                  shorthand: firstElement.name === 'rows'
                }
              ]
            };
          }
        }
      }
    }
  },
  StringLiteral(path) {
    if (path.node.value.includes('NOW()')) {
      path.node.value = path.node.value.replace(/NOW\(\)/g, 'CURRENT_TIMESTAMP');
    }
    if (path.node.value.includes('CURDATE()')) {
      path.node.value = path.node.value.replace(/CURDATE\(\)/g, 'CURRENT_DATE');
    }
  },
  TemplateElement(path) {
    if (path.node.value.raw.includes('NOW()')) {
      path.node.value.raw = path.node.value.raw.replace(/NOW\(\)/g, 'CURRENT_TIMESTAMP');
      path.node.value.cooked = path.node.value.raw;
    }
    if (path.node.value.raw.includes('CURDATE()')) {
      path.node.value.raw = path.node.value.raw.replace(/CURDATE\(\)/g, 'CURRENT_DATE');
      path.node.value.cooked = path.node.value.raw;
    }
  }
});

const output = generate(ast, { retainLines: true }, code);
fs.writeFileSync('src/controllers/loanController.js', output.code);
console.log('loanController.js refactored successfully.');
