/*global describe, it, expect, beforeAll*/
'use strict';

const Sym   = require('../lib/rules').Sym;
const Rule  = require('../lib/rules').Rule;

var   sum, prod, r, f;

describe('Sym', () => {

  describe('constructor()', () => {

    it('takes a name parameter and assigns it to `name`', () => {
      sum = new Sym('sum');
      expect(sum.name).toBe('sum');
    });

  });

});

describe('Rule', () => {

  beforeAll(() => {
    sum = new Sym('sum');
    prod = new Sym('prod');
  });

  describe('constructor()', () => {

    it('extends Array', () => {
      r = new Rule(sum, ['+']);
      expect(r instanceof Array).toBe(true);
    });

    it('takes a LHS parameter and assigns it to `lhs`', () => {
      r = new Rule(sum, ['+']);
      expect(r.lhs).toBe(sum);
    });

    it('throws if no RHS is given', () => {
      f = () => r = new Rule(sum);
      expect(f).toThrowError();
    });

    it('throws if an empty RHS is given', () => {
      f = () => r = new Rule(sum, []);
      expect(f).toThrowError();
    });

    it('accepts a valuator function as third optional param', () => {
      r = new Rule(sum, [sum, '+', prod], (x, _, y) => x + y);
      expect(r.evaluate instanceof Function).toBe(true);
    });

    it('accepts a single non-terminal on the RHS', () => {
      r = new Rule(sum, [prod], (x) => x);
      expect(r.lhs).toBe(sum);
      expect(r).toContain(prod);
    });

  });

  describe('evaluate()', () => {

    it('evaluates an array of values using the given function', () => {
      r = new Rule(sum, [sum, '+', prod], (x, _, y) => x + y);
      expect(r.evaluate([1, '+', 2])).toBe(3);
    });

    it('fails if the first argument is not an array', () => {
      f = () => new Rule(sum, [sum, '+', prod], (x, _, y) => x + y).evaluate(1);
      expect(f).toThrowError();
    });

  });

  it('\'s RHS is accessible via array indices', () => {
    r = new Rule(sum, ['+']);
    expect(r[0]).toBe('+');
  });

  it('\'s `lhs` property is non-enumerable', () => {
    r = new Rule(sum, ['+']);
    expect(Object.propertyIsEnumerable(r, 'lhs')).toBe(false);
  });

  it('\'s `rhs` can be iterated with forEach', () => {
    let items = [sum, '+', prod];
    r = new Rule(sum, items);
    let filteredRhs = r.filter((item, index) => item === items[index]);
    expect(filteredRhs.length).toBe(3);
  });

});

