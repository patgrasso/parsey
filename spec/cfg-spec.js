/*global describe, it, expect, beforeAll, beforeEach, jasmine*/
'use strict';

const Sym       = require('../parsey').Sym;
const Rule      = require('../parsey').Rule;
const CFG       = require('../lib/cfg');

var   cfg, r, s, np, vp;

describe('CFG', () => {

  beforeAll(() => {
    s = new Sym('S');
    np = new Sym('NP');
    vp = new Sym('VP');
  });

  it('extends the native Array', () => {
    cfg = new CFG();
    expect(cfg instanceof Array).toBe(true);
  });

  describe('constructor()', () => {

    it('optionally accepts an array of Rules to initialize with', () => {
      let rules = [
        Rule(s, [np, vp]),
        Rule(vp, [vp, np])
      ];
      cfg = new CFG(rules);
      expect(cfg).toEqual(jasmine.arrayContaining(rules));
    });

    it('accepts stringy rules in the optional array argument', () => {
      let rules = [
        'S -> NP VP',
        'NP -> Det N',
        'VP -> V NP'
      ];
      cfg = new CFG(rules);
      expect(cfg).toContain(Rule(s, [np, vp]));
      expect(cfg).toContain(Rule(np, [Sym('Det'), Sym('N')]));
      expect(cfg).toContain(Rule(vp, [Sym('V'), np]));
      expect(cfg).not.toContain(Rule(vp, [Sym('V'), vp]));
    });

    it('ignores non-array things passed in', () => {
      cfg = new CFG('peanut butter');
      expect(cfg.length).toBe(0);
    });

    it('initializes fine with no rules provided', () => {
      cfg = new CFG();
      expect(cfg.length).toBe(0);
    });

  });

  describe('rule()', () => {

    beforeEach(() => {
      cfg = new CFG();
    });

    it('accepts a Rule object and adds it to the CFG "array"', () => {
      r = new Rule(s, [np, vp]);
      cfg.rule(r);
      expect(cfg.length).toBe(1);
    });

    it('accepts a string of the form "A -> B C D" to create a rule', () => {
      cfg.rule('A -> B C D');
      expect(cfg[0]).toEqual(Rule(Sym('A'), [Sym('B'), Sym('C'), Sym('D')]));
      expect(cfg.length).toBe(1);
    });

    it('throws if the stringy rule does not have a separator "->"', () => {
      let f = () => cfg.rule('rule');
      expect(f).toThrowError();
    });

    it('returns the rule it just added/created', () => {
      r = cfg.rule('S -> NP VP');
      expect(r).toEqual(Rule(s, [np, vp]));
    });

    it('tries to match existing Syms by name when given a stringy rule', () => {
      cfg.rule(Rule(s, [np, vp]));
      r = cfg.rule('VP -> NP VP');

      expect(r instanceof Rule).toBe(true);
      expect(r.lhs).toBe(vp);
      expect(r[0]).toBe(np);
      expect(r[1]).toBe(vp);
    });

    it('throws if two Syms with the same name are found when trying to match', () => {
      cfg.rule(Rule(new Sym('S'), [np, vp]));
      cfg.rule(Rule(new Sym('S'), [np, vp]));
      let f = () => cfg.rule('S -> A B C D');

      expect(f).toThrowError();

      cfg = new CFG();
      cfg.rule(Rule(s, [new Sym('NP'), vp]));
      cfg.rule(Rule(s, [new Sym('NP'), vp]));
      let g = () => cfg.rule('S -> NP');

      expect(g).toThrowError();
    });

    it('creates a new Sym if one cannot be found by name', () => {
      r = cfg.rule('S -> P');
      expect(r.lhs).not.toBe(s);
      expect(r.lhs).toEqual(s);
      expect(r[0]).toEqual(Sym('P'));
    });

    it('treats double quoted symbols ("") as terminal string symbols', () => {
      r = cfg.rule('sum -> sum "+" prod');
      expect(r[1]).toBe('+');
    });

    it('treats single quoted symbols (\'\') as terminal string symbols', () => {
      r = cfg.rule('sum -> sum \'+\' prod');
      expect(r[1]).toBe('+');
    });

    it('treats regex-like symbols (e.g. /\\d+/) as terminal RegExp symbols', () => {
      r = cfg.rule('factor -> /\\d+/');
      expect(r[0] instanceof RegExp).toBe(true);
      expect(r[0].source).toBe(/\d+/.source);
    });

    // NOTE: the 'y' flag, or 'sticky' flag, is not supported in node v5.
    // Also, RegExp objects in v5 don't have the 'flags' property.
    it('captures regex flags (g, i, m) on regex terminal symbols', () => {
      r = cfg.rule('factor -> /\\d+/mig');
      expect(r[0] instanceof RegExp).toBe(true);
      if (r[0].flags !== undefined) {
        expect(r[0].flags).toBe('gim');
      } else {
        expect(r[0].ignoreCase).toBe(true);
        expect(r[0].multiline).toBe(true);
        expect(r[0].global).toBe(true);
      }
    });

  });

  describe('getSymbols()', () => {

    beforeEach(() => {
      cfg = new CFG();
    });

    it('finds all unique Sym objects referenced by rules in the CFG', () => {
      cfg.rule(Rule(s, [np, vp]));
      expect(cfg.getSymbols()).toEqual(jasmine.objectContaining({
        S: s,
        NP: np,
        VP: vp
      }));
    });

    it('only returns one reference for each unique Sym object found', () => {
      cfg.rule('A -> B C');
      cfg.rule('C -> B A');
      expect(cfg.getSymbols()).toEqual(jasmine.objectContaining({
        A: Sym('A'),
        B: Sym('B'),
        C: Sym('C')
      }));
    });

    it('ignores terminal symbols (regex, strings)', () => {
      cfg.rule('sum -> sum "+" prod');
      expect(cfg.getSymbols()).not.toEqual(jasmine.objectContaining({
        '+': Sym('+')
      }));
      expect(Object.keys(cfg.getSymbols()).length).toBe(2);
      expect(cfg.getSymbols()).toEqual(jasmine.objectContaining({
        sum: Sym('sum'),
        prod: Sym('prod')
      }));
    });

  });

});

