/*eslint no-console:0*/


const parser    = require('./lib/parser');
//const interp    = require('./interp');
const readline  = require('readline');

const rl        = readline.createInterface(process.stdin, process.stdout);


function printTree(tree, level) {
  if (tree === undefined) { return; }
  if (typeof tree === 'object') {
    console.log(`${Array(level).join(' ')}(${tree.item.lhs.name}`);
    tree.children.forEach(t => printTree(t, level + 2));
    console.log(`${Array(level).join(' ')})`);
    return;
  }
  return console.log(`${Array(level).join(' ')}'${tree}'`);
}


function interpret(parseTree) {
  if (typeof parseTree === 'string' || parseTree == null) {
    return parseTree;
  }

  let values = parseTree.children
    .map((tree) => interpret(tree))
    .filter((value) => value != null);

  return parseTree.item.evaluate(values);
}



rl.setPrompt('expr> ');
rl.prompt();

rl.on('line', (line) => {
  if (line.trim() === '') {
    return rl.prompt();
  }

  try {
    let tree = parser.parse(line.trim());
    //console.log(JSON.stringify(tree, null, 2));
    printTree(tree, 1);
    console.log('=>', interpret(tree));
  } catch (e) {
    console.error(e.message);
  }
  rl.prompt();

}).on('close', () => {
  console.log();
  process.exit(0);
});
