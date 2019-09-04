'use strict';
const debugSocketIo = require('debug')('socketio');

let socket = null;
let init = false;
let io;

const initSocketListener = (newIO) => {
  io = newIO;
  io.on('connection', (newSocket) => {
    debugSocketIo('user connected');
    init = true;

    socket = newSocket;

    socket.on('disconnect', () => {
      debugSocketIo('user disconnected');
      return null;
    });
    return null;
  });
  return null;
};

const sendMessage = (messageType, message) => {
  if (!init) return;
  io.emit(messageType, message);
};

const sendLog = (type, message) => {
  if (!init) return;
  io.emit(type, message);
};

module.exports = {initSocketListener, sendMessage, sendLog};
