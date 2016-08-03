/**
 * Export module for the parsey package
 *
 * @module parsey
 */

module.exports = {
  /**
   * @see module:lib/parser.parse
   */
  parse     : require('./lib/parser').parse,

  /**
   * @see module:lib/tokenizer
   */
  tokenize  : require('./lib/tokenizer'),

  /**
   * @see module:lib/rules~Rule
   */
  Rule      : require('./lib/rules').Rule,

  /**
   * @see module:lib/rules~Sym
   */
  Sym       : require('./lib/rules').Sym
};

