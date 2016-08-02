
let terminals = require('./rules').getTokens();


module.exports = (sent, terms) => {
  terms = terms || terminals;

  let tokens = terms
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

