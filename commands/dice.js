const debug = require('debug');
const _ = require('lodash');

const dlog = debug('bot:commands:dice');

function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function dice(args) {
  let [sides] = args;
  let description = '';
  if (_.isNil(sides) || _.isEmpty(sides)) sides = 20;
  dlog(`sides %s`, sides);

  if (sides !== 20) description = `(${sides})`;
  return `You rolled ${rollDice(sides)} ${description}`;
}

module.exports = dice;
