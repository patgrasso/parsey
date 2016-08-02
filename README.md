
# parsey [![Build Status][travis-image]][travis-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Parsey is a parser for context-free grammars. It utilizes
[earley parsing](https://www.wikiwand.com/en/Earley_parser), a top-down chart
parsing algorithm that can parse a large set of grammars.

Parsey takes a list of rules (which can be defined using the `Rule` constructor)
and some input sentence, then constructs a parse tree for the given language.
The many applications of this include abstract syntax tree creation, NLP, and
arithmetic, to name a few.


## Installation
Clone Nyota from github:
```
git clone https://github.com/patgrasso/Nyota
```


## Usage
```javascript
const Rule  = require('parsey/lib/rules').Rule;
const Sym   = require('parsey/lib/rules').Sym;
const parse = require('parsey/lib/parser').parse;

const sum = new Sym('sum');
const prod = new Sym('prod');
const factor = new Sym('factor');

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
const Sym = require('parsey/lib/rules').Sym;
let sum = new Sym('sum');
let prod = new Sym('prod');
```

Rules describe the structure of a language. They contain a left-hand side
consisting of a sole symbol, a right-hand side consisting of a list of symbols,
and an optional evaluation function.

```javascript
const Rule = require('parsey/lib/rules').Rule;
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


### Parsing
Given a list of Rules, parsing becomes as simple as

```javascript
const parse = require('parsey/lib/parser').parse;
parse('1 + 2 * 3', grammar);
```

The `parse()` function returns a parse tree, which is a node of the following
structure:

```json
{
  item: [Rule],
  children: [Array]
}
```

Elements in children can be either nodes of the above structure, or strings.

Example:
```json
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


## Testing
Testing parsey requres jasmine (2.0+). All specs can be found in `spec/`. To run
all tests, simply run `npm test` in the project's root.


## License
MIT


[travis-image]: https://travis-ci.org/patgrasso/parsey.svg?branch=master
[travis-url]: https://travis-ci.org/patgrasso/parsey
[coveralls-image]: https://coveralls.io/repos/patgrasso/parsey/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/patgrasso/parsey?branch=master

