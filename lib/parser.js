/*eslint no-console:0*/
'use strict';

const rules     = require('./rules');
const tokenize  = require('./tokenizer');


function parse(sent, grammar, tokenizer) {
  let tokens = (tokenizer || tokenize)(sent, grammar || rules.rules);
  let states = earley(tokens, grammar || rules.rules);
  return dfs(states, tokens);
}


function earley(tokens, grammar) {
  let states  = Array.apply(null, Array(tokens.length + 1)).map(() => []);
  var i, j;

  let rulePairs = grammar.map((rule) => ({
    name    : rule.lhs.name,
    rule    : rule,
    position: 0,
    origin  : 0
  }));

  [].push.apply(states[0], rulePairs);

  for (i = 0; i <= tokens.length; i += 1) {
    for (j = 0; j < states[i].length; j += 1) {
      predict(tokens, states, i, j, grammar);
      scan(tokens, states, i, j);
      complete(tokens, states, i, j);
    }
  }

  return swap(removeUnfinishedItems(states));
}


function predict(tokens, states, i, j, grammar) {
  let curr = states[i][j];

  // prediction
  if (curr.rule[curr.position] instanceof rules.Sym) {
    grammar.forEach((rule) => {
      let stateHasItem = states[i].filter((earleyItem) => {
        return earleyItem.rule === rule &&
               curr.position === 0;//earleyItem.position;
      }).length > 0;

      if (!stateHasItem) {
        states[i].push({
          name    : rule.lhs.name,
          rule    : rule,
          position: 0,
          origin  : i
        });
      }
    });
  }
}


function scan(tokens, states, i, j) {
  let newItem
    , curr = states[i][j];

  // scan
  if (curr.rule[curr.position] instanceof RegExp) {
    // regex matches token
    if (curr.rule[curr.position].test(tokens[i]) && i < states.length) {
      newItem = Object.assign({}, curr);
      newItem.position += 1;
      states[i + 1].push(newItem);
    }
  }
  if (typeof curr.rule[curr.position] === 'string') {
    // string equals token
    if (curr.rule[curr.position] === tokens[i] && i < states.length) {
      newItem = Object.assign({}, curr);
      newItem.position += 1;
      states[i + 1].push(newItem);
    }
  }
}

function complete(tokens, states, i, j) {
  let newItem
    , curr = states[i][j];

  // completion (check first because the position may be out of bounds)
  if (curr.position >= curr.rule.length) {
    states[curr.origin].forEach((earleyItem) => {
      if (earleyItem.rule[earleyItem.position] === curr.rule.lhs) {
        let stateHasItem = states[i].filter((ei) => {
          return ei.rule === earleyItem.rule &&
                 ei.position === earleyItem.position + 1 &&
                 ei.origin === earleyItem.origin;
        }).length > 0;

        if (stateHasItem) {
          return;
        }
        newItem = Object.assign({}, earleyItem);
        newItem.position += 1;
        states[i].push(newItem);
      }
    });
  }
}

function removeUnfinishedItems(states) {
  return states.map((state) => state.filter((earleyItem) => {
    return earleyItem.position >= earleyItem.rule.length;
  }));
}

function swap(states) {
  let newStates = Array.apply(null, Array(states.length)).map(() => []);

  states.forEach((state, i) => {
    state.forEach((earleyItem) => {
      newStates[earleyItem.origin].push(earleyItem);
      earleyItem.origin = i;
    });
  });
  return newStates;
}

function dfs(states, tokens) {
  let root = states[0].reduce((best, curr) => {
    if (best == null || curr.origin > best.origin) {
      return curr;
    }
    return best;
  }, null);

  if (root == null) {
    throw new SyntaxError(`Parsing error near '${tokens[0]}' `);
  }
  if (root.origin !== tokens.length) {
    throw new SyntaxError(`Parsing error near '${tokens[root.origin]}' `);
  }

  return {
    item    : root.rule,
    children: dfsHelper(states, root, 0, 0, tokens)
  };
}


function dfsHelper(states, root, state, depth, tokens) {
  var edges;

  // Base case: we finished the root rule
  if (state === root.origin && depth === root.rule.length) {
    return [];
  }

  // If the current production symbol is a terminal
  if (root.rule[depth] instanceof RegExp) {
    if (root.rule[depth].test(tokens[state])) {
      let subMatch = dfsHelper(states, root, state + 1, depth + 1, tokens);

      if (subMatch) {
        return [tokens[state]].concat(subMatch);
      }
    }
    return null;
  } else if (typeof root.rule[depth] === 'string') {
    if (root.rule[depth] === tokens[state]) {
      let subMatch = dfsHelper(states, root, state + 1, depth + 1, tokens);

      if (subMatch) {
        return [tokens[state]].concat(subMatch);
      }
    }
    return null;
  }

  // Otherwise, it must be a non-terminal
  edges = states[state]
    .filter((item) => item.rule.lhs === root.rule[depth])
    .map((item) => {
      let subMatch = dfsHelper(states, root, item.origin, depth + 1, tokens);

      if (subMatch) {
        return [{
          item    : item.rule,
          children: dfsHelper(states, item, state, 0, tokens)
        }].concat(subMatch);
      }
      return null;
    })
    .filter((list) => list);

  if (edges.length > 1) {
    let diffs = edges.filter(
      (tree) => JSON.stringify(tree) !== JSON.stringify(edges[0])
    );

    if (diffs.length > 0) {
      //console.log('Ambiguity\n' + JSON.stringify(edges, null, 2));
      console.log('Ambiguous rules');
    }
  }

  return edges[0];
}


//let sentence = '23 + ( 32 * 46 )';
//let sentence = '( 23 + 32 ) * 46';
//let sentence  = '23 + 32 * 46';
//let sentence = '( ( 12 ) )';
//let sentence = '1 * 2 + 3 * 4 + 5';
//let sentence = '1 + 2 + 3';
//let sentence = '1^3 + 2 * 3(3)';
//let tree = parse(sentence, rules.rules);

//console.log(JSON.stringify(tree, null, 2));

module.exports.parse  = parse;
module.exports.earley = earley;
module.exports.dfs    = dfs;
