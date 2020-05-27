const debug = require('debug');
const fetch = require('node-fetch');
const _ = require('lodash');

const dlog = debug('bot:commands:age');

function age(args) {
  let [userName] = args;

  if (_.isNil(userName) || _.isEmpty(userName)) userName = 'jeffblankenburg';

  const url = `https://decapi.me/twitch/accountage/${userName}`;

  const options = {
    method: 'GET',
  };

  return fetch(url, options)
    .then((res) => res.text())
    .then((r) => `@${userName} has been on Twitch for ${r}.`);
}

module.exports = age;
