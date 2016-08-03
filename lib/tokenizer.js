/**
 * Provides a function for tokenizing a sentence given some grammar
 *
 * @module lib/tokenizer
 */

'use strict';

/**
 * Tokenizes a sentence given some grammar by finding all terminal symbols
 * within the grammar and splitting the sentence by each of those symbols
 *
 * @function
 * @param {string} sent - Sentence or string to be split/tokenized
 * @param {Array.<module:lib/rules~Rule|Rule>} grammar - List of
 *    [Rules]{@link module:lib/rules~Rule} that define the grammar
 * @return {string[]} Tokens/the sentence, split by each terminal character
 *    found within the grammar
 */
module.exports = (sent, grammar) => {
  let terms = grammar.reduce(
      (tokens, rule) => tokens.concat(
        rule.filter((sym) => typeof sym === 'string' || sym instanceof RegExp)
      ), [])
    , tokens = terms
      .map((token) => {
        if (typeof token === 'string') {
          return token.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
        }
        return token.source;
      })
    , delims = RegExp('(' + tokens.join('|') + ')');

  return sent
    .split(delims)
    .map((item) => item.trim())
    .filter((item) => item !== '');
};

