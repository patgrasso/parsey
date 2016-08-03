/*global describe, it, expect, beforeAll*/
'use strict';

const Sym       = require('../lib/rules').Sym;
const Rule      = require('../lib/rules').Rule;
const tokenize  = require('../lib/tokenizer');

var   sum, prod, factor, gram, f, tokens;

describe('tokenizer()', () => {

  beforeAll(() => {
    sum = new Sym('sum');
    prod = new Sym('prod');
    factor = new Sym('factor');

    gram = [
      new Rule(sum,     [sum, '+', prod],     (x, _, y) => x + y),
      new Rule(sum,     [prod],               (x) => x),
      new Rule(prod,    [prod, '*', factor],  (x, _, y) => x * y),
      new Rule(prod     [factor],             (x) => x),
      new Rule(factor,  ['(', sum, ')'],      (_, x) => x),
      new Rule(factor,  [/\d+/],              (n) => parseFloat(n))
    ];
  });

  it('throws an error when no grammar is given', () => {
    f = () => tokenize('2 * 3');
    expect(f).toThrowError();
  });

  it('splits a string by each terminal character in the grammar', () => {
    tokens = tokenize('(2*3)+(4*5)', gram);
    expect(tokens).toEqual([
      '(', '2', '*', '3', ')',
      '+',
      '(', '4', '*', '5', ')'
    ]);
  });

  it('strips whitespace around each token', () => {
    tokens = tokenize('2 * 3', gram);
    expect(tokens).toEqual(['2', '*', '3']);
  });

  it('treats regex matches as own tokens', () => {
    tokens = tokenize('1 23 456', gram);
    expect(tokens).toEqual(['1', '23', '456']);
  });

});
