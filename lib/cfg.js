/**
 * Defines the CFG class, a container for production rules that essentially
 * amounts to an array with some extra methods
 *
 * @module lib/cfg
 */

'use strict';

const Rule  = require('./rules').Rule;
const Sym   = require('./rules').Sym;

/**
 * Regex that matches bare JS regex expressions like /^\d+$/g
 * @constant {RegExp} REGEX_REGEX
 */
const REGEX_REGEX = new RegExp('^\/(.*)\/([gimy]*)$');

/**
 * Regex that matches bare JS string expressions like "hello" and 'hello'
 * @constant {RegExp} STR_REGEX
 */
const STR_REGEX   = new RegExp('^\'(.*)\'|"(.*)"$');


/**
 * Constructs a new context-free grammar, which is just a container for
 * production rules
 *
 * @class CFG
 * @extends Array
 * @constructor
 * @param {rules=} - Optional array of {@link module:lib/rules.Rule|Rules} to
 *    initialize the grammar with
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
 * {@link Rule}, or a string of the form
 * <pre>
 *    A -> B C D
 * </pre>
 * Symbols in a stringy rule (such as 'A', 'B', 'C', and 'D' above) will be
 * searched for by name in existing rules and replaced if a match is found, or
 * if no match is found a new Sym will be created.
 *
 * Terminal symbols such as "a", 'b' will be treated as terminal strings and not
 * converted into Syms, and likewise bare regexps such as /\d+/ will be
 * converted into RegExp objects
 *
 * @method rule
 * @param {string|Rule} theRule - Rule object or string describing a production
 * @return {Rule} The rule that was either passed in, or created from the string
 *    passed in, and subsequently added to the grammar
 * @throws {SyntaxError} If a stringy rule is passed in that doesn't have a ->
 *    separator
 */
CFG.prototype.rule = function (theRule) {
  var rhs, lhs, syms, match;

  if (typeof theRule === 'string') {

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
    theRule = new Rule(lhs, rhs);
    this.push(theRule);
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

