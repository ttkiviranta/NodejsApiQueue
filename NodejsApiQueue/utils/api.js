const axios = require('axios');
const minimist = require('minimist');
const args = minimist(process.argv.slice(2));
var headers = require('./parse_headers.js');
//const ora = require('ora');
var now = require("performance-now");
var MAX_RUNS_PER_WINDOW = args.m;
var RUN_WINDOW = args.w;

var circularQueue = []; //Urls which will call in current run window. for example 6 times per secund, minute, hour...
var originalUnshift = circularQueue.unshift;

var config = {
    headers: { 'X-My-Custom-Header': 'Header-Value' }
    // timeout: 10000
};
var urls = [];
var errUrls = []; // Array of the missed calls
var retry_after_Time = 10; //default, but in error 427 it reads value for using servers retry- after value


module.exports = () => {

    const EventEmitter = require("events").EventEmitter;
    class ErrEventEmitter extends EventEmitter {
        emitObject(event, obj = {}) {
            this.emit(event, obj);
            return obj;
        }
    }

    const emitter = new ErrEventEmitter();

    emitter.on("retrysErrorCalls", function (e) {
        e.message += " error calls";
        urls = [];
        errUrls.forEach(function (entry) {
            urls.push(entry);
        });
      
        tryAgain();

    });

    function waitSeconds(iMilliSeconds) {
        var counter = 0
            , start = new Date().getTime()
            , end = 0;
     //   const spinner = ora().start();
        while (counter < iMilliSeconds) {
            end = new Date().getTime();
            counter = end - start;
        }
      //  spinner.stop();
    }

    function tryAgain() {
        console.log("Error handling");
        iMilliSeconds = retry_after_Time * 1000;
        console.log("Start waiting " + iMilliSeconds + "ms...");
        waitSeconds(iMilliSeconds);       
        console.log("...Waiting end");
        DoErrUrls();
    }

    function DoErrUrls() {
        if (errUrls.length > 0) {
           // count = count - errCount;
            count = 0;
            errCount = 0;
            errUrls.forEach(doApi_Get);
            errUrls = [];
        }

    }

    function statusMessage() {
        // Todo
    }

    function isAllDone() {
        if ((count + errCount) === (urls.length)) {

            var distance = now();
            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);
            console.log("Total time: " + days + "d " + hours + "h " + minutes + "m " + seconds + "s");
            console.log("Efective time: " + efectTime / 1000 + "s");
            // TODO statusMessage
            if (errCount === 0) {
                console.log("Averidge time per API call: " + (efectTime / count) / 1000 + "s");
                console.log("Suggestion for next time. Use value for option -w:" + Math.round((efectTime / args.c)) * 5 + " , maybe little bit more or less!"); //5 = Experimental value...
                console.log("And use value 1 for -option -m.");
                console.log("If you using these vales you probably avoid err = 429 message. Better suggestion may needs more statics!)");
                console.log("REMARK: Yours your API call count is: " + count);
                
            }
            else {
                console.log("Averidge time per API call: " + (efectTime / count) / 1000 + "s");
                console.log("Suggestion for next time. Use value for option -w:" + Math.round((efectTime / args.c)) * 4 + " , maybe little bit more or less!"); //4 = Experimental value...
                console.log("And use value 1 for -option -m.");
                console.log("If you using these vales you probably avoid err = 429 message. Better suggestion may needs more statics!)");
                console.log("REMARK: Yours your API call count is: " + count);
                const evt = emitter.emitObject("retrysErrorCalls", { message: "Retry" });
                console.log(evt.message); 
            }

            return true;

        }
        {
            //  console.log("Continue (" + (count + errCount).toString() + "/" + urls.length - 1 + ")...");
            console.log("Continue (" + (count + errCount).toString() + "/" + (urls.length).toString() + ")...");

            return false;
        }
    }

    function limit(fn) {
    //   console.log("*****limit begin");
        var urlCallQueue = [],
            invokeTimes = Object.create(circularQueue),
            waitId = null;
      //  console.log("fn :" + fn);

        function limited() {
     //       console.log("*****limited");
            urlCallQueue.push(() => {
                invokeTimes.unshift(now());
                fn.apply(this, arguments);
            });

            if (mayProceed()) {
              //  console.log("dequeue1");
                return dequeue();
            }

            if (waitId === null) {
             //   console.log("dequeue2");
                waitId = setTimeout(dequeue, timeToWait());
            }
       //     console.log("urlCallQueue.length:" + urlCallQueue.length);
       //     console.log("originalUnshift.length:" + originalUnshift.length);
       //     console.log("circularQueue.length:" + circularQueue.length);
        }

        limited.cancel = function () {
            clearTimeout(waitId);
        };

        return limited;

        function dequeue() {
           // console.log("*****dequeue");
            waitId = null;
            clearTimeout(waitId);

            urlCallQueue.shift()();

            if (mayProceed()) {
             //   console.log("dequeue4");
                return dequeue();
            }

            if (urlCallQueue.length) {
              //  console.log("dequeue5");
                waitId = setTimeout(dequeue, timeToWait());
         //       console.log("waitId:" + waitId);
            }
           // console.log("urlCallQueue.length:" + urlCallQueue.length);
           // console.log("originalUnshift.length:" + originalUnshift.length);
           // console.log("circularQueue.length:" + circularQueue.length);
        }

        function mayProceed() {
           // console.log("******mayProceed");
           // console.log("urlCallQueue.length:" + urlCallQueue.length);
           // console.log("originalUnshift.length:" + originalUnshift.length);
           // console.log("circularQueue.length:" + circularQueue.length);
            return urlCallQueue.length && (timeForMaxRuns() >= RUN_WINDOW);
        }

        function timeToWait() {
            var ttw = RUN_WINDOW - timeForMaxRuns();
            //temp = ttw < 0 ? 0 : ttw;
           // console.log("*****timeToWait:" + temp);
            return ttw < 0 ? 0 : ttw;
        }

        function timeForMaxRuns() {
            var temp = now() - (invokeTimes[MAX_RUNS_PER_WINDOW - 1] || 0);
           // console.log("*****timeForMaxRuns:" + temp);
            return (now() - (invokeTimes[MAX_RUNS_PER_WINDOW - 1] || 0));
        }
       
    }
   
    circularQueue.MAX_LENGTH = MAX_RUNS_PER_WINDOW;

    circularQueue.unshift = function (element) {
        if (this.length === this.MAX_LENGTH) {
           // console.log("*************circularQueue.length************:" + circularQueue.length);
            this.pop();
        }
       // console.log("***circular***" + this + "/" + element);
       // console.log("urlCallQueue.length:" + urlCallQueue.length);
       // console.log("originalUnshift.length:" + originalUnshift.length);
       // console.log("circularQueue.length:" + circularQueue.length);
        return originalUnshift.call(this, element);
    };


    var count = 0;
    var errCount = 0;
    var errStatus = false;
    var efectTime = now() - now(); //


    var doApi_Get = limit(function (url) {
        var t0 = now();
        
        // var res = isAllDone();
        axios.get(url, config).then
            (function (response) {
                count++;
                var t1 = now();
                var d = new Date();
                var n = d.toLocaleTimeString() + ":" + d.getMilliseconds();
                console.log(n+" - "+ "Count " + count + ": " + response.data + " Cumulative time: " + (t1 - t0) + " ms.");
                efectTime = efectTime + (t1 - t0);
                console.log(headers.parse_headers(response.headers, 'x-ratelimit-limit'));
                console.log(headers.parse_headers(response.headers, 'x-ratelimit-remaining'));
                var res = isAllDone();
            })
            .catch(function (error) {
                if (error.response) {
                    errCount++;
                    errUrls.push(url);
                    errStatus = true;
                    var t1 = now();
                    var d = new Date();
                    var n = d.toLocaleTimeString() + ":" + d.getMilliseconds();
                    console.log(n + " - " + "***ERR " + errCount + "  BEGIN *** Response status: " + error.response.status);
                    console.log(error.response.data);
                    //  console.log(error.response.headers);
                    console.log(headers.parse_headers(error.response.headers, 'x-ratelimit-limit'));
                    console.log(headers.parse_headers(error.response.headers, 'x-ratelimit-remaining'));
                    console.log(headers.parse_headers(error.response.headers, 'retry-after'));
                    var str = headers.parse_headers(error.response.headers, 'retry-after').toString();
                    var resVal = str.split(":", 2);
                    retry_after_Time = parseInt(resVal[1]);  
                    console.log("***ERR END*** " );
                    var res = isAllDone();
                    //

                }

            });

    });

    if (urls.length === 0) {
        DoUrls();
  
    }

    function DoUrls(){
        for (var i = 0; i < args.c; i++) {
            urls.push(args.u);
        }
        if (urls.length > 0) {
            urls.forEach(doApi_Get);
        }
       
    }
};
