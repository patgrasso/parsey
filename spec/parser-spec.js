/*global describe, it, expect, beforeAll, jasmine*/
'use strict';

const Sym       = require('../lib/rules').Sym;
const Rule      = require('../lib/rules').Rule;
const parse     = require('../lib/parser').parse;
const earley    = require('../lib/parser').earley;
const dfs       = require('../lib/parser').dfs;
const tokenize  = require('../lib/tokenizer');

var   sum, prod, factor, gram, f, tokens, states, tree;

describe('parser', () => {

  beforeAll(() => {
    sum = new Sym('sum');
    prod = new Sym('prod');
    factor = new Sym('factor');

    gram = [
      new Rule(sum    , [sum, '+', prod]    , (x, _, y) => x + y),
      new Rule(sum    , [prod]              , (x) => x),
      new Rule(prod   , [prod, '*', factor] , (x, _, y) => x * y),
      new Rule(prod   , [factor]            , (x) => x),
      new Rule(factor , ['(', sum, ')']     , (_, x) => x),
      new Rule(factor , [/\d+/]             , (n) => parseFloat(n))
    ];
  });

  describe('earley()', () => {

    it('cascades rule completion once a predicted rule successfully parses', () => {
      tokens = tokenize('2 * 3', gram);
      states = earley(tokens, gram);

      // 0-1 '2' : factor -> /\d+/
      expect(states[0]).toContain({
        name: 'factor',
        rule: gram[5],
        position: 1,
        origin: 1
      });

      // 0-1 '2' : prod -> factor
      expect(states[0]).toContain({
        name: 'prod',
        rule: gram[3],
        position: 1,
        origin: 1
      });

      // 0-1 '2' : sum -> prod
      expect(states[0]).toContain({
        name: 'sum',
        rule: gram[1],
        position: 1,
        origin: 1
      });
    });

    it('returns an earley item in [0] whose origin = tokens.length', () => {
      tokens = tokenize('2 * 3', gram);
      states = earley(tokens, gram);

      expect(states[0]).toContain({
        name: 'prod',
        rule: gram[2],
        position: 3,
        origin: 3
      });
    });

    it('does not return a whole-expr earley item when the parse fails', () => {
      tokens = tokenize('2 * 3 *', gram);
      states = earley(tokens, gram);

      expect(states[0]).not.toContain({
        name: jasmine.any(String),
        rule: jasmine.any(Rule),
        position: jasmine.any(Number),
        origin: 4
      });
    });

  });

  describe('dfs()', () => {

    it('properly parses a sentence', () => {
      tokens = tokenize('2 * 3', gram);
      states = earley(tokens, gram);
      tree = dfs(states, tokens);

      expect(tree).toEqual(
        jasmine.objectContaining({ item: gram[2] }) // prod -> prod * factor
      );
      expect(tree.children[0]).toEqual(
        jasmine.objectContaining({ item: gram[3] }) // prod => factor
      );
      expect(tree.children[0].children[0]).toEqual(
        jasmine.objectContaining({ item: gram[5] }) // factor -> /\d+/
      );
      expect(tree.children[0].children[0].children[0]).toBe('2');

      expect(tree.children[1]).toBe('*');

      expect(tree.children[2]).toEqual(
        jasmine.objectContaining({ item: gram[5] }) // factor -> /\d+/
      );
      expect(tree.children[2].children[0]).toBe('3');
    });

    it('throws an error if the parse did not finish due to tra', () => {
      tokens = tokenize('2 * 3 *', gram);
      states = earley(tokens, gram);
      f = () => dfs(states, tokens);

      expect(f).toThrowError(SyntaxError);
    });

    it('throws an error if the parse did not finish', () => {
      tokens = tokenize('* 2 * 3', gram);
      states = earley(tokens, gram);
      f = () => dfs(states, tokens);

      expect(f).toThrowError(SyntaxError);
    });

  });

  describe('parse()', () => {

    it('properly parses a sentence', () => {
      tree = parse('2 * 3', gram);

      expect(tree).toEqual(
        jasmine.objectContaining({ item: gram[2] }) // prod -> prod * factor
      );
      expect(tree.children[0]).toEqual(
        jasmine.objectContaining({ item: gram[3] }) // prod => factor
      );
      expect(tree.children[0].children[0]).toEqual(
        jasmine.objectContaining({ item: gram[5] }) // factor -> /\d+/
      );
      expect(tree.children[0].children[0].children[0]).toBe('2');

      expect(tree.children[1]).toBe('*');

      expect(tree.children[2]).toEqual(
        jasmine.objectContaining({ item: gram[5] }) // factor -> /\d+/
      );
      expect(tree.children[2].children[0]).toBe('3');
    });

    it('accepts an optional tokenizer function', () => {
      f = () => parse('2 * 3', gram, (sent) => sent.split(' '));
      expect(f).not.toThrowError();

      f = () => parse('2*3', gram, (sent) => sent.split('*'));
      expect(f).toThrowError(SyntaxError);
    });

    it('parses 23 + (32 * 46) given a rule set (see parser-spec.js)', () => {
      f = () => parse('23 + (32 * 46)', gram);
      expect(f).not.toThrow();
    });

    it('parses (23 + 32) * 46 given a rule set (see parser-spec.js)', () => {
      f = () => parse('(23 + 32) * 46', gram);
      expect(f).not.toThrow();
    });

    it('parses 23 + 32 * 46 given a rule set (see parser-spec.js)', () => {
      f = () => parse('23 + 32 * 46', gram);
      expect(f).not.toThrow();
    });

    it('parses ((12)) given a rule set (see parser-spec.js)', () => {
      f = () => parse('((12))', gram);
      expect(f).not.toThrow();
    });

    it('parses 1 * 2 + 3 * 4 + 5 given a rule set (see parser-spec.js)', () => {
      f = () => parse('1 * 2 + 3 * 4 + 5', gram);
      expect(f).not.toThrow();
    });

    it('parses 1 + 2 + 3 given a rule set (see parser-spec.js)', () => {
      f = () => parse('1 + 2 + 3', gram);
      expect(f).not.toThrow();
    });

    // TODO: resolve ambiguity by spawning a separate parse tree
    it('arbitrates on an ambiguous parse', () => {
      gram.push(new Rule(sum, [prod, '+', sum]));
      f = () => parse('1 + 2 * 3 + 4', gram);
      expect(f).not.toThrow();
      gram.pop();
    });

    it('allows multiple of same rule in same earley state, as long as ' +
       'they have differing position and origin', () => {
      let rules = [
        new Rule(factor, [factor, factor]),
        new Rule(factor, [factor, '+']),
        new Rule(factor, [/\d+/])
      ];
      f = () => parse('1 + 2 3', rules);
      expect(f).not.toThrow();
    });

    it('does not sub-match a regex that does not match the current token', () => {
      let rules = [
        new Rule(factor, [factor, factor]),
        new Rule(factor, [factor, /\+/]),
        new Rule(factor, [/\d+/])
      ];
      f = () => parse('1 + 2 3', rules);
      expect(f).not.toThrow();
    });

  });

});
