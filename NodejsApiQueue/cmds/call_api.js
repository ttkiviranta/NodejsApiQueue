//const ora = require('ora');
const getAPI = require('../utils/api.js');
const minimist = require('minimist');
const args = minimist(process.argv.slice(2));

console.log("url:" + args.u + " count:" + args.c + " max:" + args.m + " in window " + args.w + " ms");


module.exports = () => {
    let data = getAPI();
    //  const spinner = ora().start();
    //   console.log(data);
    //  spinner.stop();
};