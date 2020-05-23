const Airtable = require('airtable');
const debug = require('debug');
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const sound = require('sound-play');
const tmi = require('tmi.js');
const YoutubeMp3Downloader = require('youtube-mp3-downloader');

const commands = require('./commands');
const sfx = require('./sfx.js');
const keys = require('./keys.js');
const opts = require('./identity.js');

const dlog = debug('blankenbot:index');
dlog('start');

// Create a client with our options
const client = new tmi.client(opts);

// Called every time a message comes in
async function onMessageHandler(target, context, msg, self) {
  if (self) {
    return;
  } // Ignore messages from the bot

  dlog('incomming message %O', {
    target,
    context,
    msg,
    self,
  });

  const base = new Airtable({ apiKey: keys.airtable_api_key }).base(
    'applh8X0qW7POJk9c',
  );

  base('Twitch').create(
    {
      Username: context.username,
      Message: msg.trim(),
      Channel: target,
      Context: JSON.stringify(context),
    },
    function (err, record) {
      if (err) {
        console.error(`ERROR = ${err}`);
        return;
      }
      dlog(`RECORDID = ${record.getId()}`);
    },
  );

  // Remove whitespace from chat message
  const [commandName, ...commandArgs] = msg.trim().split(' ');
  dlog(`COMMAND NAME = ${commandName}`);

  switch (commandName) {
    case '!lamp':
      // call function ();
      break;

    case '!followers':
      commands
        .followers(commandArgs)
        .then((r) => client.say(target, `@${context.username} ${r}`));
      break;

    default:
      break;
  }

  if (commandName.toLowerCase().startsWith('!lamp ')) {
    const color = commandName.replace('!lamp ', '');
    dlog(`COLOR RECEIVED = ${color}`);
    var response = await changeLampColor(color);
    dlog(`RESPONSE RECEIVED = ${JSON.stringify(response)}`);
    // TODO: WE REALLY SHOULD BE RESPONDING TO THE USER WITH A SUCCESS OR FAILURE.  FIX YOUR CALLBACKS.
    client.say(target, `@${context.username} ${response}`);
  } else if (commandName.toLowerCase().startsWith('!dice')) {
    let sides = parseInt(commandName.replace('!dice', ''));
    if (Number.isNaN(sides)) sides = 20;
    let num = rollDice(sides);
    if (sides !== 20) num += ` (${sides})`;
    client.say(target, `@${context.username} You rolled ${num}`);
  } else if (commandName.toLowerCase().startsWith('!miles')) {
    /*
    Strava.config({
      "access_token"  : keys.strava_access_token,
      "client_id"     : keys.strava_client_id
    });
    const payload = await Strava.athlete.get({id:45634});
    dlog("ATHLETE = " + JSON.stringify(payload));
    */
  } else if (commandName.toLowerCase().startsWith('!age')) {
    dlog('COMMAND = AGE');
    // https://decapi.me/twitch/accountage/jeffblankenburg

    let username = commandName.replace('!age', '').trim().replace('@', '');
    if (username.length === 0) username = 'jeffblankenburg';

    const decapiResponse = await httpsGet(
      'decapi.me',
      `/twitch/accountage/${username}`,
    );

    client.say(
      target,
      `@${context.username} @${username} has been on Twitch for ${decapiResponse}.`,
    );
  } else if (commandName.toLowerCase().startsWith('!followers')) {
    let username = commandName
      .replace('!followers', '')
      .trim()
      .replace('@', '');
    if (username.length === 0) username = 'jeffblankenburg';

    var response = await httpsGet(
      'api.crunchprank.net',
      `/twitch/followcount/${username}`,
    );

    client.say(
      target,
      `@${context.username} @${username} currently has ${response} followers.`,
    );
    dlog(`FOLLOWERS RESPONSE = ${JSON.stringify(response)}`);
  } else if (commandName.startsWith('!soundeffect')) {
    var params = commandName.replace('!soundeffect ', '').split(' ');
    // [CommandName, YouTubeId, StartTime, EndTime]
    let shouldDownload = true;

    if (params[0].length > 15) {
      shouldDownload = false;
      client.say(
        target,
        `@${context.username} Error: Command Name was too long.  Must be less than 15 characters.  Please use the format !soundeffect command_name youtube_id start_time end_time`,
      );
    } else if (params[1].length != 11) {
      shouldDownload = false;
      client.say(
        target,
        `@${context.username} Error: Invalid Youtube ID.  Please use the format !soundeffect command_name youtube_id start_time end_time`,
      );
    } else if (isNaN(params[2]) || isNaN(params[3])) {
      shouldDownload = false;
      client.say(
        target,
        `@${context.username} Error: Start time or end time is invalid.  Use the format M:SS. Please use the format !soundeffect command_name youtube_id start_time end_time`,
      );
    }
    // else if ()
    // MAKE SURE IT IS NO LONGER THAN 5 seconds.

    // TODO: SOME VALIDATION ON THE VALUE HERE.  THE YOUTUBE NPM HAS VALIDATORS.
    if (shouldDownload) {
      const YD = new YoutubeMp3Downloader({
        ffmpegPath: '/usr/local/opt/ffmpeg/bin/ffmpeg', // Where is the FFmpeg binary located?
        outputPath: './youtube', // Where should the downloaded and encoded files be stored?
        youtubeVideoQuality: 'highest', // What video quality should be used?
        queueParallelism: 2, // How many parallel downloads/encodes should be started?
        progressTimeout: 2000, // How long should be the interval of the progress reports
      });
      dlog(`YD = ${JSON.stringify(YD)}`);
      YD.download(params[1], `${params[0]}.mp3`);
      YD.on('finished', function (err, data) {
        dlog(`FILE FINISHED DOWNLOADING = ${JSON.stringify(data)}`);

        exec(
          `trimp3 ${data.file.replace('./youtube/', '')} ${data.file.replace(
            './youtube/',
            '',
          )} ${params[2]} ${params[3]}`,
          (error, stdout, stderr) => {
            if (error) {
              dlog(`error: ${error.message}`);
              return;
            }
            if (stderr) {
              dlog(`stderr: ${stderr}`);
              return;
            }
            fs.rename(
              data.file,
              data.file.replace('./youtube/', './approved/'),
              async (error) => {},
            );
            dlog(`stdout: ${stdout}`);
          },
        );
      });

      YD.on('error', function (error) {
        dlog(error);
      });

      YD.on('progress', function (progress) {
        dlog(JSON.stringify(progress));
      });
      // var video = await YouTube("http://www.youtube.com/watch?v=" + params[1]).pipe(fs.createWriteStream("./youtube/" + params[0] + ".mp4"));

      client.say(
        target,
        `@${context.username} Video has been queued for approval.`,
      );
      // TODO: HOW DO I ALERT MODS THAT A VIDEO IS READY FOR APPROVAL?
      // dlog("VIDEO = " + JSON.stringify(video));
    }
  } else if (commandName.toLowerCase().startsWith('!approve')) {
    if (canApprove(context)) {
      var params = commandName.replace('!approve ', '').split(' ');
      client.say(target, `@${context.username} approved ${params[0]}`);
    }
    // TODO: THIS DOESN'T WORK YET.
    /*
    var params = commandName.replace("!approve ", "").split(" ");
    converter.setFfmpegPath("/usr/local/bin/ffmpeg", function(err) {
      if (err) throw err;
    });
    var audio = converter.convert("./youtube/" + params[0] + ".mp4", "./mp3/" + params[0] + ".mp3", function(err) {
      if (err) throw err;
      dlog("done");
    });
    dlog("AUDIO = " + JSON.stringify(audio));
    */
  } else if (commandName.toLowerCase().startsWith('!rename')) {
    if (canApprove(context)) {
      var params = commandName.replace('!rename ', '').split(' ');
      // TODO: NEED TO MAKE SURE THAT THE ORIGINAL FILE EXISTS BEFORE WE CHANGE IT.
      fs.rename(
        `./sfx/${params[0]}.mp3`,
        `./sfx/${params[1]}.mp3`,
        async (error) => {
          if (error) {
            client.say(
              target,
              `@${context.username} command !${params[0]} doesn't exist.`,
            );
          } else {
            const soundRecord = await httpGet(
              keys.airtable_base_chat,
              `&filterByFormula=AND(Name%3D%22${encodeURIComponent(
                params[0],
              )}%22)`,
              'SoundEffect',
            );
            const airtable = new Airtable({
              apiKey: keys.airtable_api_key,
            }).base(keys.airtable_base_chat);
            const record = await new Promise((resolve, reject) => {
              airtable('SoundEffect').update(
                [
                  {
                    id: soundRecord.records[0].fields.RecordId,
                    fields: { Name: params[1] },
                  },
                ],
                function (err, records) {
                  if (err) {
                    console.error(err);
                    return;
                  }
                  resolve(records[0]);
                },
              );
            });
            client.say(
              target,
              `@${context.username} renamed !${params[0]} to !${params[1]}`,
            );
            dlog(`FILE RENAMED. ${params[0]} => ${params[1]}`);
          }
        },
      );
    }
  } else if (commandName.toLowerCase().startsWith('!soundlist')) {
    /*
    var fileList = await new Promise((resolve, reject) => {
      fs.readdir("./sfx/", {withFileTypes: false}, (error, files) => {
        if(error) reject(error);
        else {
          resolve(files);
        }
      });
    });
    //fileList = JSON.stringify(fileList).replace(".DS_Store,", "").split(",").join("\n");
    fileList = fileList.toString().replace(".DS_Store,", "").split(",").join("\n").replace(/.mp3/g, "");;
    //fs.writeFile("soundeffects.txt", fileList, function (err) {
      //if (err) return dlog(err);
      //dlog('Hello World > helloworld.txt');
    //});

    //dlog("FILELIST = " + fileList);
    dlog("FILELIST TYPE = " + typeof(fileList));
    //var fileArray = fileList.split(",");
    //for (var i=0;i<fileArray;i++) {fileArray[i] = "!" + fileArray[i].replace(".mp3", "")}
    dlog("FILELIST CLEAN= " + fileList);
    */
    client.say(
      target,
      `@${context.username} https://airtable.com/embed/shrq01NQPAkkZMfIO?backgroundColor=orange&viewControls=on`,
    );
  } else if (commandName.startsWith('!')) {
    if (
      context['custom-reward-id'] === '222eacc1-4ec4-4833-b0b2-cc81effd0ee6'
    ) {
      const fileList = await new Promise((resolve, reject) => {
        fs.readdir('./sfx/', (error, files) => {
          if (error) reject(error);
          else {
            resolve(files);
          }
        });
      });
      const file = fileList.find((file) =>
        file.toLowerCase().startsWith(commandName.replace('!', '')),
      );
      if (file != undefined) {
        sound.play(`./sfx/${file}`);
        const soundRecord = await httpGet(
          keys.airtable_base_chat,
          `&filterByFormula=AND(Name%3D%22${encodeURIComponent(
            file.replace('.mp3', ''),
          )}%22)`,
          'SoundEffect',
        );
        dlog(`SOUND RECORD = ${JSON.stringify(soundRecord)}`);
        const airtable = new Airtable({ apiKey: keys.airtable_api_key }).base(
          keys.airtable_base_chat,
        );
        const record = await new Promise((resolve, reject) => {
          airtable('SoundEffect').update(
            [
              {
                id: soundRecord.records[0].fields.RecordId,
                fields: {
                  PlayCount: soundRecord.records[0].fields.PlayCount + 1,
                },
              },
            ],
            function (err, records) {
              if (err) {
                console.error(err);
                return;
              }
              resolve(records[0]);
            },
          );
        });
      }
    }
  }
}

// Function called when the "dice" command is issued
function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}
// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  dlog(`* Connected to ${addr}:${port}`);
}

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

async function getSpecificDataById(table, name) {
  const response = await httpGet(
    keys.airtable_base_data,
    `&filterByFormula=AND(IsDisabled%3DFALSE(),Name%3D%22${encodeURIComponent(
      name,
    )}%22)`,
    table,
  );
  const data = response.records[0];
  dlog(`SPECIFIC ITEM = ${JSON.stringify(data)}`);
  return data;
}

function canApprove(context) {
  if (context.username === 'jeffblankenburg') return true;
  if (context['badges-raw'].toString().includes('vip')) return true;
  if (context.mod) return true;
  return false;
}

function httpsGet(host, path, method = 'GET', header = {}) {
  const options = { host, port: 443, path, method: 'GET' };
  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return reject(
          new Error(
            `${response.statusCode}: ${response.req.getHeader('host')} ${
              response.req.path
            }`,
          ),
        );
      }
      response.on('data', (chunk) => {
        returnData += chunk;
      });
      response.on('end', () => {
        resolve(returnData);
      });
      response.on('error', (error) => {
        reject(error);
      });
    });
    request.end();
  });
}

function httpGet(base, filter, table = 'Data') {
  const options = {
    host: 'api.airtable.com',
    port: 443,
    path: `/v0/${base}/${table}?api_key=${keys.airtable_api_key}${filter}`,
    method: 'GET',
  };
  dlog(`FULL PATH = http://${options.host}${options.path}`);
  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return reject(
          new Error(
            `${response.statusCode}: ${response.req.getHeader('host')} ${
              response.req.path
            }`,
          ),
        );
      }
      response.on('data', (chunk) => {
        returnData += chunk;
      });
      response.on('end', () => {
        resolve(JSON.parse(returnData));
      });
      response.on('error', (error) => {
        reject(error);
      });
    });
    request.end();
  });
}

function httpsPut(host, path, data, header = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      host,
      port: 443,
      path,
      method: 'PUT',
      headers: header,
    };
    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';
      // dlog("FULL PATH = https://" + options.host + options.path);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return reject(
          new Error(
            `${response.statusCode}: ${response.req.getHeader('host')} ${
              response.req.path
            }`,
          ),
        );
      }
      response.on('data', (chunk) => {
        returnData += chunk;
      });
      response.on('end', () => {
        resolve(returnData);
      });
      response.on('error', (error) => {
        reject(error);
      });
      // dlog("RETURNDATA = " + JSON.stringify(returnData));
    });
    request.on('error', (error) => {
      console.error(error);
    });
    request.write(data);
    request.end();
  });
}

async function changeLampColor(color) {
  const data = JSON.stringify({
    power: 'on',
    color,
    brightness: 100,
    duration: 1,
    fast: true,
  });
  const header = {
    Authorization: `Bearer ${keys.lifx_key}`,
    'content-type': 'application/json',
  };
  const response = await httpsPut(
    'api.lifx.com',
    `/v1/lights/id:${keys.lifx_bulb_id}/state`,
    data,
    header,
  );
  // dlog("LAMP RESPONSE = " + JSON.stringify(response));
  return `Lamp updated to ${color}`;
}

// Connect to Twitch:
client.connect();
