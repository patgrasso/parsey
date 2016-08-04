/**
 * Provides functions for parsing sentences with a pre-constructed grammar.
 * The parsing algorithm is an implementation of the earley top-down chart
 * parser. The parse tree is constructed from the chart using depth-first search
 *
 * @module lib/parser
 */
/*eslint no-console:0*/

'use strict';

const rules     = require('./rules');
const tokenize  = require('./tokenizer');


/**
 * Tokenizes, then parses, the input string with the given grammar. The result
 * is a parse tree represented with plain objects. See
 * {@link module:lib/parser.dfs|dfs()} for an example of the structure of a
 * parse tree
 *
 * @function parse
 * @memberof module:lib/parser
 * @param {string} sent - Input string to parse
 * @param {Rule[]|CFG} grammar - Set of Rules that define a language
 * @param {Function} [tokenizer=#tokenize} - Function that accepts a string and
 *    a grammar (optionally) and splits the input string into tokens, each
 *    representing a symbol in the language
 * @return {object} Root node of the parse tree
 */
function parse(sent, grammar, tokenizer) {
  let tokens = (tokenizer || tokenize)(sent, grammar || rules.rules);
  let states = earley(tokens, grammar || rules.rules);
  return dfs(states, tokens);
}


/**
 * Parses the input tokens using the earley top-down chart parsing algorithm
 * to product a set of states, each containing a list of earley items
 *
 * @function earley
 * @memberof module:lib/parser
 * @param {string[]} tokens - Sequence of symbols to be parsed
 * @param {Rule[]|CFG} grammar - Set of rules that define a language
 * @return {state[]} Set of 'states', each of which contains a list of earley
 *    items. Each earley item looks something like this:
 *    <pre><code>
 *    {
 *      name: [string],
 *      rule: [Rule],
 *      position: [number],
 *      origin: [number]
 *    }
 *    </code></pre>
 *    An earley item represents a completed parse of some individual rule. The
 *    position should be equivalent to rule.length, and the origin, despite its
 *    name, describes the state at which parse finished.
 *
 *    This means that an earley item <i>should</i> exist in state 0 with an
 *    origin equivalent to the number of tokens passed in to indicate that the
 *    entire input was parsed successfully for some rule
 */
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


/**
 * Prediction stage in the earley algorithm
 * {@link http://loup-vaillant.fr/tutorials/earley-parsing/recogniser}
 *
 * This also avoids adding duplicate rules to a state, a pitfall caused by
 * left-recursive grammars
 *
 * @function predict
 * @param {string[]} tokens - Input tokens being parsed
 * @param {state[]} states - Set of lists of earley items
 * @param {number} i - Index of the earley state to be processed
 * @param {number} j - Index of the earley item to be processed within the state
 * @param {Rule[]|CFG} grammar
 */
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


/**
 * Scanning stage in the earley algorithm
 * {@link http://loup-vaillant.fr/tutorials/earley-parsing/recogniser}
 *
 * @function scan
 * @param {string[]} tokens - Input tokens being parsed
 * @param {state[]} states - Set of lists of earley items
 * @param {number} i - Index of the earley state to be processed
 * @param {number} j - Index of the earley item to be processed within the state
 */
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


/**
 * Completion stage in the earley algorithm
 * {@link http://loup-vaillant.fr/tutorials/earley-parsing/recogniser}
 *
 * @function complete
 * @param {string[]} tokens - Input tokens being parsed
 * @param {state[]} states - Set of lists of earley items
 * @param {number} i - Index of the earley state to be processed
 * @param {number} j - Index of the earley item to be processed within the state
 */
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


/**
 * Removes earley items from each state that failed to completely parse through.
 * In other words, removes earley items whose position is less than the length
 * of its rule
 *
 * @function removeUnfinishedItems
 * @param {state[]} states - Set of lists of earley items
 * @return {state[]} Set of lists of completed earley items
 */
function removeUnfinishedItems(states) {
  return states.map((state) => state.filter((earleyItem) => {
    return earleyItem.position >= earleyItem.rule.length;
  }));
}


/**
 * Places earley items in the states in which they originated, as opposed to the
 * states in which they finished parsing, and set their `origin` properties to
 * the state in which they finished.
 *
 * This allows a depth-first search of the chart to move forwards through the
 * graph, which is more intuitive than having to move backwards
 *
 * @function swap
 * @param {state[]} states - Set of lists of earley items
 * @return {state[]} Set of lists of earley items, but each item now exists in
 *    the state at which it originated, and the <code>origin</code> property of
 *    each item points to the state at which the parse completed
 */
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


/**
 * Performs a depth-first search on the chart generated by {@link #earley()} in
 * order to construct a parse tree, an example of which is shown below
 *
 * @example
 * {
 *   item: <Rule sum -> [factor, '+', factor]>,
 *   children: [
 *     {     // first symbol - 'factor'
 *       item: <Rule factor -> [/\d+/]>,
 *       children: [
 *         '2'
 *       ]
 *     },
 *     '+',  // second symbol
 *     {     // third symbol - another 'factor'
 *       item: <Rule factor -> [/\d+/]>,
 *       children: [
 *         '3'
 *       ]
 *     }
 *   ]
 * }
 *
 * @function dfs
 * @memberof module:lib/parser
 * @param {state[]} states - Set of lists of earley items
 * @param {string[]} tokens - Input tokens to be parsed
 * @return {object} Root node of the parse tree
 */
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


/**
 * Recursive function that explores a specific earley item, constructs the parse
 * tree for it, then sends it up the chimney!
 *
 * @function dfsHelper
 * @param {state[]} states - Set of lists of earley items
 * @param {earleyItem} root - Current earley item being explored, a tree for
 *    which is to be constructed
 * @param {number} state - Current state/index of our current position in the
 *    list of tokens
 * @param {number} depth - Index/position in the root's rule (RHS). In other
 *    words, index of the next symbol to match or explore
 * @param {string[]} tokens - List of input tokens
 * @return {null|object[]} Null if the search provided NO results for the
 *    given node, or a list of tree nodes, which are the respective parse trees
 *    of each of the root rule's RHS symbols
 */
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


module.exports.parse  = parse;
module.exports.earley = earley;
module.exports.dfs    = dfs;
