/**
 * Starts a continuous prompt that parses simple sentences with various parts of
 * speech and displays their parse trees
 */
/*eslint no-console:0*/

const parse     = require('../parsey').parse;
const readline  = require('readline');
const CFG       = require('../parsey').CFG;

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


let gram = new CFG([
  'CMD  -> AV NP',
  'CMD  -> AV NP NP',
  'CMD  -> AV NP PP',
  'S    -> NP VP',
  'S    -> NP VP "and" VP',
  'NP   -> Det N',
  'NP   -> Det Adj N',
  'NP   -> Adj N',
  'NP   -> N',
  'VP   -> AV "to" VP',
  'VP   -> AV PP',
  'VP   -> TV NP',
  'VP   -> AV NP',
  'VP   -> AV',
  'PP   -> P NP',

  'Det  -> "the"',
  'Det  -> "my"',
  'Det  -> "a"',
  'N    -> /dogs?/',
  'N    -> /tree?/',
  'N    -> /ball?/',
  'N    -> /houses?/',
  'N    -> "ground"',
  'N    -> "sky"',
  'N    -> "i"',
  'Adj  -> "blue"',
  'N    -> "blue"',
  'TV   -> "is"',
  'AV   -> /plays?/',
  'AV   -> /runs?/',
  'AV   -> /jumps?/',
  'AV   -> /bites?/',
  'AV   -> /finds?/',
  'AV   -> /gives?/',
  'AV   -> "have"',
  'AV   -> /likes?/',
  'P    -> "on"',
  'P    -> "in"',
  'P    -> "to"',
  'P    -> "with"',
  'P    -> "onto"',
  'P    -> "into"',
  'P    -> "around"'
]);



rl.setPrompt('sentence> ');
rl.prompt();

rl.on('line', (line) => {
  if (line.trim() === '') {
    return rl.prompt();
  }

  try {
    let tree = parse(
      line.trim(), gram,
      (sent) => sent.split(' ').map((tok) => tok.toLowerCase())
    );
    printTree(tree, 1);
  } catch (e) {
    console.error(e.message);
  }
  rl.prompt();
}).on('close', () => {
  console.log();
  process.exit(0);
});
