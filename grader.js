#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var sys = require('util');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
// temp file name to put html into file for parsing
// maybe a better solution is to figure out how to 
// convert restler respone to cheerio input, or
// generate a random not existing file?
var TEMP_FILENAME = "sdfo4e49.html";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertURLExists = function(inurl) {
    var instr = inurl.toString();
    //console.log("Running assertURLExists");
    rest.get(instr).once('complete', function(result) {
        if (result instanceof Error) {
            sys.puts('URL Error: ' + result.message);
            process.exit(1);
        } else {
            //console.log("URL exist checked!");
        }
    });
    //console.log("End assertURLExists");
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var buildfn = function(checks) {
    var response2console = function(result, response) {
        if (result instanceof Error) {
            console.error('URL get Error: ' + response.message);
        } else {
            fs.writeFileSync(TEMP_FILENAME, result);
            var checkJson = checkHtmlFile(TEMP_FILENAME, checks);
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson);
            fs.unlinkSync(TEMP_FILENAME);
        }
    };
    return response2console;
};

var checkHtmlURL = function(htmlURL, checksfile) {
    //console.log("Running CheckHtmlURL");
    rest.get(htmlURL).once('complete', buildfn(checksfile));
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-u, --url <url>', 'Path to url to be tested', assertURLExists)
        .parse(process.argv);
    if (program.url) {
        checkHtmlURL(program.url, program.checks);
    } else {
        var checkJson = checkHtmlFile(program.file, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        //console.log("Checking file" + program.file);
        console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
    exports.checkHtmlURL = checkHtmlURL;
}
