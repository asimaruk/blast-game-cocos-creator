'use strict';

const path = require('path');
const fs = require('fs');
const configs = ['game-config.json', 'sprites-config.json'];

function onBuildFinished(options, callback) {
  const copyProms = configs.map(cfg => {
    return new Promise((res, rej) => {
      const src = path.join(__dirname, cfg);
      const dst = path.join(options.dest, cfg);
      Editor.log(`Copy from ${src} to ${dst}`);
      fs.copyFile(src, dst, (err) => {
        if (err) {
          Editor.failed(err);
          rej(err);
        } else {
          Editor.log(`${cfg} copied to build dest`);
          res();
        }
      })
    });
  });
  Promise.all(copyProms)
    .then(() => callback())
    .catch((e) => callback(new Error('Configs not copied!')));
}

module.exports = {
  load() {
    Editor.Builder.on('build-finished', onBuildFinished);
  },

  unload() {
    Editor.Builder.removeListener('build-finished', onBuildFinished);
  },

  messages: {
  },
};