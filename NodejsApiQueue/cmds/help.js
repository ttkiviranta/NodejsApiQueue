const menus = {
    main: `
    app [command] <options> 
 
    call_api ........... show result of API call
    version ............ show package version
    help ............... show help menu for a command`,

    call_api: `
    app call_api <options> <options> <options> <options>

    --url, -u ........ name of the url to use 
    --count, -c ...... how many times make url call
    --max, -m ....     max run per window
    --window, -w ......time window in milli secunds`,
};

module.exports = (args) => {
    const subCmd = args._[0] === 'help'
        ? args._[1]
        : args._[0];

    console.log(menus[subCmd] || menus.main);
};