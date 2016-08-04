
# Parsey
[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Inline Docs][inch-ci-image]][inch-ci-url]

Parsey is a parser for context-free grammars. It utilizes
[earley parsing](https://www.wikiwand.com/en/Earley_parser), a top-down chart
parsing algorithm that can parse a large set of grammars.

Parsey takes a list of rules (which can be defined using the `Rule` constructor)
and some input sentence, then constructs a parse tree for the given language.
The many applications of this include abstract syntax tree creation, NLP, and
arithmetic, to name a few.


## Installation
Install from npm:
```
npm install parsey --save
```


## Usage
```javascript
const Rule    = require('parsey').Rule;
const Sym     = require('parsey').Sym;
const parse   = require('parsey').parse;

const sum     = new Sym('sum');
const prod    = new Sym('prod');
const factor  = new Sym('factor');

// Rule( [lhs : Sym], [rhs : Array], [valuator : Function] )

let grammar = [
  // sum
  new Rule(sum    , [sum, '+', prod]    , (x, _, y) => x + y),
  new Rule(sum    , [prod]              , (x) => x),

  // product
  new Rule(prod   , [prod, '*', factor] , (x, _, y) => x * y),
  new Rule(prod   , [factor]            , (x) => x),

  // factor
  new Rule(factor , ['(', sum, ')']     , (_, x) => x),
  new Rule(factor , [/\d+/]             , (n) => parseFloat(n))
];

let expr = '2 + 3 * (1 + 4)';
let parseTree = parse(exp, grammar);

console.log(evaluate(parseTree));
// => 17
```


### Rules and Sym(bol)s
A Sym is nothing more than an object that references a specific symbol for use
in grammar rules, with a `name` attribute that describes the symbol (names need
not be unique).

```javascript
const Sym = require('parsey').Sym;
let sum = new Sym('sum');
let prod = new Sym('prod');
```

Rules describe the structure of a language. They contain a left-hand side
consisting of a sole symbol, a right-hand side consisting of a list of symbols,
and an optional evaluation function.

```javascript
const Rule = require('parsey').Rule;
//                     lhs        rhs               valuator
let sumRule = new Rule(sum, [sum, '+', prod], (x, _, y) => x + y);
```

This rule states that a sum can be any `sum`, followed by a `+`, followed by
any `prod`. The rhs can be populated with `Sym` objects, strings, or `RegExp`
objects.

This rule's valuator is a function that takes 3 arguments (one for each symbol
on the rhs), and adds the first and last (we don't care about the '+').

The Rule class is extended from Array, so the rhs symbols correspond to a Rule's
indices and all of the methods on Array.prototype will apply to the rhs.


### The CFG
The CFG is a glorified array, a container for your rules. It has some methods
like `rule()` and `getSymbols()`, which can be handy for creating rules from
strings.

```javascript
const CFG = require('parsey').CFG;
let grammar = new CFG();

grammar.rule('S -> NP VP');
grammar.rule('NP -> Det N');
grammar.rule('VP -> V NP');

grammar.rule('Det -> "the");
grammar.rule('Det -> "a");

grammar.rule('V -> /runs?/');
grammar.rule('V -> "ran"');
```

`rule()` will try to find existing symbols in the grammar that have the same
names as the ones that appear in a production string, and will create new Sym
objects if a symbol could not be found.

It will also treat string-looking symbols like `"the"` as terminal symbols and
leave them as strings, and likewise will turn things like `/regex/` into RegExp
objects, which are also terminals.


### Parsing
Given a list of Rules, parsing becomes as simple as

```javascript
const parse = require('parsey').parse;
parse('1 + 2 * 3', grammar);
```

The `parse()` function returns a parse tree, which is a node of the following
structure:

```javascript
{
  item: [Rule],
  children: [Array]
}
```

Elements in children can be either nodes of the above structure, or strings.

Example:
```javascript
// 1 * 2
{
  item: <Rule 'prod' [prod, '*', factor]>,
  children: [
    {
      item: <Rule 'factor' [/\d+/]>,
      children: [ '1' ]
    },
    '*',
    {
      item: <Rule 'factor' [/\d+/]>,
      children: [ '2' ]
    }
  ]
}
```


## Examples
Check out [examples](https://github.com/patgrasso/parsey/tree/master/examples) to see parsey in
action for various use cases!


## Testing
Testing parsey requres jasmine (2.0+). All specs can be found in `spec/`. To run
all tests, simply run `npm test` in the project's root.


## License
MIT


[npm-image]: https://img.shields.io/npm/v/parsey.svg?style=flat
[npm-url]: https://www.npmjs.com/package/parsey
[travis-image]: https://travis-ci.org/patgrasso/parsey.svg?branch=master
[travis-url]: https://travis-ci.org/patgrasso/parsey
[coveralls-image]: https://coveralls.io/repos/github/patgrasso/parsey/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/patgrasso/parsey?branch=master
[inch-ci-image]: https://inch-ci.org/github/patgrasso/parsey.svg?branch=master
[inch-ci-url]: https://inch-ci.org/github/patgrasso/parsey

