/**
 * Defines the CFG class, a container for production rules that essentially
 * amounts to an array with some extra methods
 *
 * @module lib/cfg
 */

'use strict';

const Rule  = require('./rules').Rule;
const Sym   = require('./rules').Sym;

const REGEX_REGEX = new RegExp('^\/(.*)\/([gimy]*)$');
const STR_REGEX   = new RegExp('^\'(.*)\'|"(.*)"$');


/**
 * Constructs a new context-free grammar, which is just a container for
 * production rules
 *
 * @class CFG
 * @extends Array
 * @constructor
 * @param {rules=} - Optional array of {@link Rule}s to initialize the grammar
 *    with
 */
function CFG(rules) {
  let arr = [];

  arr.__proto__ = CFG.prototype;
  if (Array.isArray(rules)) {
    rules.forEach(arr.rule.bind(arr));
  }

  return arr;
}
Object.setPrototypeOf(CFG.prototype, Array.prototype);


/**
 * Adds a rule to the grammar. The rule can be either an instance of
 * {@link Rule}, or arguments for the Rule constructor, or a string of the form
 * <pre>
 *    A -> B C D
 * </pre>
 *
 * @example
 * grammar.rule(Rule(S, [NP, VP], (np, vp) => ...));
 * grammar.rule(S, [NP, VP], (np, vp) => ...);
 * grammar.rule('S -> NP VP', (np, vp) => ...);
 *
 * Symbols in a stringy rule (such as 'A', 'B', 'C', and 'D' above) will be
 * searched for by name in existing rules and replaced if a match is found, or
 * if no match is found a new Sym will be created.
 *
 * Terminal symbols such as "a", 'b' will be treated as terminal strings and not
 * converted into Syms, and likewise bare regexps such as /\d+/ will be
 * converted into RegExp objects
 *
 * @method rule
 * @param {string|Sym|Rule} theRule - Rule object or a LHS Sym or string
 *    describing a production
 * @param {Function=|Sym[]} maybeRHS - If `theRule` is a string, this will be
 *    the valuation function. If `theRule` is a Sym, this will be the RHS
 * @param {Function=} maybeValuator - If `theRule` is a Sym and `maybeRHS` is
 *    an array of Syms (so the arguments mimic the Rule constructor), then this
 *    is an optional valuation function
 * @return {Rule} The rule that was either passed in, or created from the string
 *    passed in, and subsequently added to the grammar
 * @throws {SyntaxError} If a stringy rule is passed in that doesn't have a ->
 *    separator
 */
CFG.prototype.rule = function (theRule, maybeRHS, maybeValuator) {
  var rhs, lhs, syms, match;

  // case 1: Rule constructor
  if (theRule instanceof Sym) {
    theRule = new Rule(theRule, maybeRHS, maybeValuator);
    this.push(theRule);

  // case 2: stringy production
  } else if (typeof theRule === 'string') {
    // split sides by separator arrow
    lhs = theRule.split('->').map((side) => side.trim());
    rhs = lhs[1];
    lhs = lhs[0];
    if (lhs == null || rhs == null) {
      throw new SyntaxError(
        'Rule must have left-hand and right-hand sides separated by \'->\''
      );
    }

    // identify all existing symbols in the grammar
    syms = this.getSymbols();

    lhs = syms[lhs] || (syms[lhs] = new Sym(lhs));
    rhs = rhs.split(' ').filter((s) => s !== '').map((name) => {
      // check to see if the identifier is surrounded by special symbols
      // /stuff/ => RegExp (terminal)
      // "stuff" => string (terminal)
      // 'stuff' => string (terminal)
      if ((match = REGEX_REGEX.exec(name)) != null) {
        return new RegExp(match[1], match[2]);
      }
      if ((match = STR_REGEX.exec(name)) != null) {
        return match[1] || match[2];
      }
      // otherwise, find || make a Sym for it
      return syms[name] || (syms[name] = new Sym(name));
    });

    // check for the optional valuator
    if (maybeRHS instanceof Function) {
      theRule = new Rule(lhs, rhs, maybeRHS);
    } else {
      theRule = new Rule(lhs, rhs);
    }
    this.push(theRule);

  // case 3: actual instance of Rule
  } else if (theRule instanceof Rule) {
    this.push(theRule);
  }
  return theRule;
};


/**
 * Retrieve all unique Sym objects within the grammar by searching each rule
 *
 * @return {object} Object whose keys are the names of each symbol, and whose
 *    values are the actual Sym object pointers
 * @throws {Error} If multiple symbols are found with the same name
 */
CFG.prototype.getSymbols = function () {
  let syms = {};

  this.forEach((rule) => {
    if (rule.lhs instanceof Sym) {
      if (syms[rule.lhs.name] != null && syms[rule.lhs.name] !== rule.lhs) {
        throw new Error(`Multiple symbols with the name '${rule.lhs.name}'`);
      }
      syms[rule.lhs.name] = rule.lhs;
    }
    rule.forEach((sym) => {
      if (sym instanceof Sym) {
        if (syms[sym.name] != null && syms[sym.name] !== sym) {
          throw new Error(`Multiple symbols with the name '${sym.name}'`);
        }
        syms[sym.name] = sym;
      }
    });
  });

  return syms;
};


module.exports = CFG;

