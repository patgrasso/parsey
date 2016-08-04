
const Rule  = require('./rules').Rule;
const Sym   = require('./rules').Sym;

const REGEX_REGEX = new RegExp('^\/(.*)\/([gimy]*)$');
const STR_REGEX   = new RegExp('^\'(.*)\'|"(.*)"$');


function CFG(rules) {
  let arr = [];

  arr.push.apply(arr, rules);
  arr.__proto__ = CFG.prototype;

  return arr;
}
Object.setPrototypeOf(CFG.prototype, Array.prototype);


CFG.prototype.rule = function (theRule) {
  var rhs, lhs, syms, match;

  if (typeof theRule === 'string') {

    // split sides by separator arrow
    [lhs, rhs] = theRule.split('->').map((side) => side.trim());
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

