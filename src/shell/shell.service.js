'use strict';
const APP_PATH = process.env.APP_PATH || '/home/pi/app/';

const {inspect} = require('util');
const chalk = require('chalk');
const debug = require('debug');

const debugShell = debug('shell');
const debugShellVerbose = debug('shell:verbose');

const async = require('async');
const moment = require('moment');

const shell = require('shelljs');

shell.config.silent = true;

const {logger} = require('../_logger/logger.js');


// shared commands
const commandReboot = 'echo reboot > /pipes/reboot.pipe';

const executeCommands = (commands, callback) => {
  if (process.env.NODE_ENV !== 'production') {
    return callback(null, [{'command': 'node ENV is development', 'code': 0, 'stdout': 'Not executed in dev!'}]);
  }
  // commandEchoFinished = "echo \"finished\""
  // commands.push({"name": "commandEchoFinished", "command": commandEchoFinished})
  const results = [];
  async.eachSeries(commands,
    (command, next) =>
      shell.exec(command.command, (code, stdout, stderr) => {
        debugShellVerbose('command', command, 'code', code);
        debugShellVerbose('stdout', stdout, 'stderr', stderr);
        const err = (stderr != null) && (stderr !== '') ? stderr : null;
        if (code !== 0) {
          logger.debug(`Command: ${command.name}, exited with code: ${code}`, stdout);
        }
        if (err) {
          logger.debug(`Command: ${command.name}`, err);
        }
        // return next err if err?
        results.push({'command': command.name, 'code': code, 'stdout': stdout});
        return next(null);
      })
    ,
    (err) => {
      if (err) {
        return callback(err);
      }
      return callback(null, results);
    });
};

// TODO: check this shell cmd
const zipLogs = (callback) => {
  const path = APP_PATH + '/logs';
  const commands = [];

  const commandDelteOld = `rm -f ${path}/logs.tar.gz`;
  commands.push({'name': 'commandDelteOld', 'command': commandDelteOld});

  const commandZip = `tar --create --gzip --file=${path}/logs.tar.gz ${path}`;
  commands.push({'name': 'commandZip', 'command': commandZip});

  executeCommands(commands, callback);
};

// TODO: check this shell cmd
const mongoDump = (callback) => {
  const path = APP_PATH + '/logs/mongo-dump';
  const commands = [];

  const commandCreate = `mkdir -p ${path}`;
  commands.push({'name': 'commandCreate', 'command': commandCreate});

  const commandMongodump = `mongodump --host localhost --port 27017 --out ${path}/$(date +%F_%T\\\(dayOfW:%u_dayOfM:%d\\\))`;
  commands.push({'name': 'commandMongodump', 'command': commandMongodump});

  executeCommands(commands, callback);
};

const getWifiOptions = (callback) => {
  if (process.env.OS === 'MAC OSX') {
    return callback(null, ['MAC OSX']);
  }
  const commands = [];

  const commandGetWifiOptions = `cat < /pipes/wifi.pipe`; // gets from wifi pipe'iwlist wlan0 scan | grep ESSID'
  commands.push({'name': 'commandGetWifiOptions', 'command': commandGetWifiOptions});

  executeCommands(commands, (err, results) => {
    if (err) {
      return callback(err);
    }
    if (!results || !results[0]) {
      return callback('No wifi detected');
    }
    const wifiOptions = results[0].stdout.replace(/\n/g, '').split(/ESSID:"(.*?)"/g).filter((entry) => entry.trim() !== '');

    return callback(null, wifiOptions);
  });
};

const configureWifi = (wifi, callback) => {
  if (process.env.OS === 'MAC OSX') {
    return callback(`Not able to do this on ${process.env.OS}`);
  }
  if (!wifi || !wifi.name) {
    return callback('Please provide wifi name and pass');
  }

  if (!wifi.pass) {
    wifi.pass = '';
  }

  const commands = [];

  const commandFlushOldWifi = 'bash /etc/wpa_supplicant/del-old-wifi.sh';
  commands.push({'name': 'commandFlushOldWifi', 'command': commandFlushOldWifi});

  const commandConfigureWifi = `printf '\nnetwork={%s\n\tssid=\"${wifi.name}\"%s\n\tpsk=\"${wifi.pass}\"%s\n}' >> /etc/wpa_supplicant/wpa_supplicant.conf`;
  commands.push({'name': 'commandConfigureWifi', 'command': commandConfigureWifi});

  commands.push({'name': 'commandReboot', 'command': commandReboot});

  executeCommands(commands, callback);
};

const reset = (callback) => {
  if (process.env.OS === 'MAC OSX') {
    return callback(`Not able to do this on ${process.env.OS}`);
  }

  const commands = [];

  const commandResetWifi = 'sudo cp /etc/wpa_supplicant/wpa_supplicant.backup.conf /etc/wpa_supplicant/wpa_supplicant.conf'
  ;
  commands.push({'name': 'commandResetWifi', 'command': commandResetWifi});

  const commandClearHistory = 'history -c'; // TODO: this only cleans the history in the container => also clean on host
  commands.push({'name': 'commandClearHistory', 'command': commandClearHistory});

  commands.push({'name': 'commandReboot', 'command': commandReboot});

  executeCommands(commands, callback);
};

// TODO: check this shell cmd
const configureDateTime = (dateTime, callback) => {
  if (process.env.OS === 'MAC OSX') {
    return callback(`Not able to do this on ${process.env.OS}`);
  }
  ({dateTime} = dateTime);
  const {timeZone} = dateTime;
  if (!dateTime || (moment(dateTime).isValid() === false)) {
    return callback('No valid date time specified');
  }
  if (!timeZone) {
    return callback('No time zone specified');
  }

  const commands = [];
  const commandSetTime = `date --set '${moment(dateTime).format('YYYY-MM-DD HH:mm:ss')}'`;
  commands.push({'name': 'commandSetTime', 'command': commandSetTime});

  const commandSetTimeZone = `echo '${timeZone}' > /etc/timeZone && dpkg-reconfigure -f noninteractive tzdata`;
  commands.push({'name': 'commandSetTimeZone', 'command': commandSetTimeZone});


  executeCommands(commands, (err, results) => {
    debugShell(`time is now ${ moment().format('YYYY-MM-DD HH:mm:ss')}`);
    return callback(err, results);
  });
};

const getSerial = (callback) => {
  if (process.env.OS === 'MAC OSX') {
    return callback(null, 'MAC OSX');
  }

  const commands = [];
  const commandGetSerial = 'cat /proc/cpuinfo | grep Serial | cut -d \' \' -f 2';
  commands.push({'name': 'commandGetSerial', 'command': commandGetSerial});
  debugShellVerbose('commands', commands);
  executeCommands(commands, (err, results) => {
    if (err) {
      debugShellVerbose('err', err);
      return callback(err);
    }
    debugShellVerbose('results', results);
    if (!results || !results[0] || results[0].code !== 0) {
      debugShell(results[0]);
      return callback('Could not get serial');
    }
    callback(null, results[0].stdout.replace('\n', ''));
  });
};

// TODO: check this shell cmd
const checkDiskSpace = (appUser, options, callback) => {
  const commands = [];

  const pathPython = `${__dirname}/python/memory.py`;
  console.log(chalk.bgGreen(``, inspect(pathPython)));
  const commandCheckDiskSpace = `python ${pathPython}`;
  commands.push({'name': 'commandCheckDiskSpace', 'command': commandCheckDiskSpace});

  executeCommands(commands, (err, status) => callback(err, status));
};

const reboot = (appUser, options, callback) => {
  if (process.env.OS === 'MAC OSX') {
    return callback(`Not able to do this on ${process.env.OS}`);
  }
  const commands = [];
  commands.push({'name': 'commandReboot', 'command': commandReboot});

  executeCommands(commands, (err, status) => callback(err, status));
};
module.exports = {
  zipLogs,
  mongoDump,
  getWifiOptions,
  configureWifi,
  reset,
  configureDateTime,
  getSerial,
  checkDiskSpace,
  reboot,
};
