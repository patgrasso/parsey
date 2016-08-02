
function Rule(lhs, rhs, valuator) {
  let arr = [];

  if (!rhs || rhs.length === 0) {
    throw new Error('Rule does not produce anything');
  }
  arr.push.apply(arr, rhs);
  arr.lhs = lhs;

  Object.defineProperty(arr, 'lhs', { value: lhs });
  Object.defineProperty(arr, 'evaluate', {
    value: (values) => valuator.apply(null, values)
  });

  arr.__proto__ = Rule.prototype;

  return arr;
}
Object.setPrototypeOf(Rule.prototype, Array.prototype);


function Sym(name) {
  let symbol = {};
  symbol.__proto__ = Sym.prototype;
  symbol.name = name;
  return symbol;
}

//const expr = new Sym('expr');
//const addexp = new Sym('addexp');
const sum     = new Sym('sum');
const prod    = new Sym('prod');
const factor  = new Sym('factor');
const exp     = new Sym('exp');
//const number  = new Sym('number');

/*
let rules = {
  multiply: [expr, '*', expr],
  add     : [expr, '+', expr],
  //subtract: [expr, '-', expr],
  //divide  : [expr, '/', expr],
  group   : ['(', expr, ')'],
  number  : [/^\d+$/]
};
*/

/*
let rules = {
  multiply: new Rule(expr, [expr, '*', expr]),
  add     : new Rule(expr, [expr, '+', expr]),
  divide  : new Rule(expr, [expr, '/', expr]),
  subtract: new Rule(expr, [expr, '-', expr]),
  group   : new Rule(expr, ['(', expr, ')']),
  number  : new Rule(expr, [/^\d+$/])
};
*/

let rules = [
  // sum
  new Rule(sum    , [sum, '+', prod]      , (x, _, y) => x + y),
  new Rule(sum    , [prod]                , (x) => x),

  // product
  new Rule(prod   , [prod, '*', exp]      , (x, _, y) => x * y),
  new Rule(prod   , [exp, '*', prod]      , (x, _, y) => x * y),
  //new Rule(prod   , [prod, '*', prod]     , (x, _, y) => x * y),
  new Rule(prod   , [exp]                 , (x) => x),
  //new Rule(prod   , [factor]),

  // distributive product
  new Rule(prod   , [exp, '(', exp, ')']  , (x, _, y)     => x * y),
  new Rule(prod   , ['(', exp, ')', exp]  , (_, x, __, y) => x * y),

  // exponent
  new Rule(exp    , [factor, '^', factor] , (x, _, y) => Math.pow(x, y)),
  new Rule(exp    , [factor]              , (x) => x),

  // factor
  new Rule(factor , ['(', sum, ')']       , (_, x) => x),
  new Rule(factor , [/\d+/]               , (n) => parseFloat(n))
];

module.exports = {
  rules : rules,
  Rule  : Rule,
  Sym   : Sym
};

