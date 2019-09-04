// ----------------------------------- HELPER FUNCTIONS --------------------------------------------------------
'use strict';
exports.toArray = (source) => {
  // console.log "source #{source.length} ", source
  const array = new Array(source.length);
  let i = 0;
  while (i < source.length) {
    array[i] = source[i];
    ++i;
  }
  return array;
};

exports.toUInt8Array = (source) => {
  // console.log "source #{source.length} ", source
  const uint8Array = new Uint8Array(source.length);
  let i = 0;
  while (i < source.length) {
    uint8Array[i] = source[i];
    ++i;
  }
  return uint8Array;
};