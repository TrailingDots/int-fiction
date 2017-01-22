//
// Misc utilities
//
// See: Prog JS Apps, Eric Elliott, p. 219
// For accessing the stack:
//     https://github.com/winstonjs/winston/issues/200
//
//require("babel-register");

function exists(x) {
    return ((x !== undefined) && (x !== null));
}

function notExists(x) {
    return !exists(x);
}


// Return astr repeated times.
function repeatString(astr, times) {
    if(times <= 0) {
        throw 'repeat: string repeat time < 0';
    } 
    var out = '';
    for(var n = 0; n < times; ++n) {
        out += astr;
    }
    return out;
}


// Given anEnv string, scan process.env for all
// env vars that contain this string as a key.
// Typically used to find all settings of 'TEST'
// in the process.env table.
// Returns a dictionary with key=envVar, value=envValue
function filterEnv(anEnv) {
    var out = {};
    var cnt = 0;
    //console.log('len of process.env:' + Object.keys(process.env).length)
    for(var sysEnv in process.env) {
        cnt += 1;
        //console.log('testing ' + sysEnv);
        if(sysEnv.indexOf(anEnv) >= 0) {
            out[sysEnv] = process.env[sysEnv];
        }
    }
    //console.log('looked at envs cnt:' + cnt);
    return out;
}

// Given a string and a width, return the string
// padded or truncated width chars.
function constantWidthString(astring, width) {
    if(astring.length > width) {
        return astring.substr(0, width);
    }
    var pad = width - astring.length;
    var slug = repeatString(' ', pad);
    return astring + slug;
}

module.exports.constantWidthString = constantWidthString;
module.exports.repeatString = repeatString;
module.exports.filterEnv = filterEnv;
module.exports.exists = exists;
module.exports.notExists = notExists;

