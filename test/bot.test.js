const assert = require('assert');
const commands = require('../commands');

describe('Age Tests', () => {
  it('Nothing should be @jeffblankenburg 5 years, 7 months', () => {
    commands
      .age('')
      .then((r) =>
        assert.equal(
          r,
          '@jeffblankenburg has been on Twitch for 5 years, 7 months.',
        ),
      );
  });
  it('@unspecifiedsoftware should be 3 weeks, 17 hours', () => {
    commands
      .age('unspecifiedsoftware')
      .then((r) =>
        assert.equal(
          r,
          '@unspecifiedsoftware has been on Twitch for 3 weeks, 17 hours.',
        ),
      );
  });
});

describe('Followers Tests', () => {
  it('@jeffblankenburg should be 346', () => {
    commands
      .followers('')
      .then((r) =>
        assert.equal(r, '@jeffblankenburg currently has 346 followers.'),
      );
  });
  it('@unspecifiedsoftware should be 29', () => {
    commands
      .followers('')
      .then((r) =>
        assert.equal(r, '@unspecifiedsoftware currently has 29 followers.'),
      );
  });
});

describe('Dice Tests', () => {
  it('Nothing should be less than 20', () => {
    const response = commands
      .dice('')
      .replace('You rolled ', '')
      .replace('.', '');

    assert(response <= 20);
  });
});
