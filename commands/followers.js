const debug = require('debug');
const fetch = require('node-fetch');
const _ = require('lodash');

const dlog = debug('blankenbot:commands:followers');

function followers(args) {
  let [userName] = args;
  dlog('followers %s', userName);

  if (_.isNil(userName) || _.isEmpty(userName)) userName = 'jeffblankenburg';

  const url = `https://api.crunchprank.net/twitch/followcount/${userName}`;
  
  const options = {
    method: 'GET',
  };

  return fetch(url, options)
    .then((res) => res.json())
    .then((r) => `@${userName} currently has ${r} followers.`);
}

module.exports = followers;
