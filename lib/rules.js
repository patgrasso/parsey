/**
 * Defines Rule and Sym classes, which are used create productions that comprise
 * a grammar
 *
 * @module lib/rules
 */

'use strict';

/**
 * Defines a production rule, with a sole symbol on the left-hand side and a
 * list of symbols on the right-hand side. The constructor also accepts a third
 * argument, a valuator function, which can be used to evaluate values that are
 * obtained by matching this production
 *
 * @class Rule
 * @extends Array
 * @constructor
 * @memberof module:lib/rules
 * @param {Sym} lhs - Sym representing the left hand side of the production
 * @param {Array.<Sym|string|RegExp>} rhs - Sequence of Syms, plain strings, or
 *    RegExp objects that represents the right hand side of the production
 * @param {Function=} valuator - Function used to evaluate values obtained by
 *    matching this production
 */
function Rule(lhs, rhs, valuator) {
  let arr = [];

  if (!rhs || rhs.length === 0) {
    throw new Error('Rule does not produce anything');
  }
  arr.push.apply(arr, rhs);
  arr.lhs = lhs;

  Object.defineProperty(arr, 'lhs', { value: lhs });
  Object.defineProperty(arr, 'evaluate', {
    value: (values) => (valuator) ? valuator.apply(null, values) : null
  });

  arr.__proto__ = Rule.prototype;

  return arr;
}
Object.setPrototypeOf(Rule.prototype, Array.prototype);


/**
 * Constructor for the Sym class, which simply represents a non-terminal symbol
 * in a grammar. While parsing, Syms are compared by reference, not by name. So,
 * the name argument is optional as it serves no purpose for parsing. For
 * debugging and evaluation of a parse tree, however, the name could be quite
 * useful
 *
 * @class Sym
 * @constructor
 * @memberof module:lib/rules
 * @param {string=} name - Name to give to the newly created symbol. Names do not
 *    need to be unique among Syms in a grammar, as they are not used to compare
 *    equality
 */
function Sym(name) {
  let symbol = {};
  symbol.__proto__ = Sym.prototype;
  symbol.name = name;
  return symbol;
}


module.exports.Rule = Rule;
module.exports.Sym  = Sym;

