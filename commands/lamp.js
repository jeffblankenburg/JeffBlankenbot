const debug = require('debug');
const fetch = require('node-fetch');
const keys = require('../keys.js');

const dlog = debug('bot:commands:lamp');

function lamp(args) {
  const [color] = args;

  const data = JSON.stringify({
    power: 'on',
    color,
    brightness: 100,
    duration: 1,
  });

  const header = {
    Authorization: `Bearer ${keys.lifx_key}`,
    'content-type': 'application/json',
    accept: 'application/json',
  };

  // TODO: Can we translate complex color names to hex?

  const url = `https://api.lifx.com/v1/lights/id:${keys.lifx_bulb_id}/state`;

  const options = {
    method: 'PUT',
    body: data,
    headers: header,
  };

  return fetch(url, options)
    .then((res) => res.json())
    .then((r) => {
      if (r.results !== undefined) return `Lamp has been updated to ${color}.`;
      return `${color} is not a valid lamp color.`;
    });
}

module.exports = lamp;
