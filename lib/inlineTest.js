/**
 * inlineTest provides testing capabilities to test in the *same*
 * module as the code. This eases the requirement and overhead
 * of writing a mocha test in a separate testing module.
 * Additionally, inlineTest permits WebStorm to debug easily
 * without having to figure out how to debug a mocha script.
 *
 * Adapted from Practical Common Lisp: 
 *          Building a Unit Test Framework, p. 103
 *
 * The routines below could be refactored for better code,
 * BUT the stack must be accessed for items such as filename,
 * line number and function name. By refactoring, the stack
 * offsets must be modified. It's much clearer to leave
 * these stack offsets as they are.
 *
 * ==============================================
 * The tracebacks don't work in node!!!!
 * Webstorm reports them properly. NUTS!!!!!
 * ==============================================
 */

var inspect = require('util').inspect;
var stackTrace = require('stack-trace');
var format = require('format');
var lcl_utils = require('./lcl_utils.js');


//
// Decide if self-testing is requested.
// objEnv appliees to a local test for
// a specific Object.
// The global TESTING env turns testing
// on and off.
// When TESTING has no value, no testing.
// When TESTING == NONE, then no testing.
// When TESTING == ALL, then everything
//  gets tested.
// When TESTING is anything else, then
// test objEnv's.
//
function isSelfTesting(objEnv) {
    if(lcl_utils.exists(process.env.TESTING) && process.env.TESTING === 'NONE') {
        return false;
    }
    // Test on the value in objEnv?
    if(lcl_utils.exists(process.env.TESTING) && process.env.TESTING === 'ALL') {
        return true;
    }
    // Test on the value in objEnv?
    if(lcl_utils.exists(process.env[objEnv])) {
        return true;    // test this one
    }
    return false;   // Nothing set, ignore selfTests.
}


/***************************************************************
// Another good stack tracer:
// Ref: http://stackoverflow.com/questions/14172455/get-name-and-line-of-calling-function-in-node-js
***************************************************************/

var stackTrace = require('stack-trace');

// Struct use to collect counts of all testing
function inTestConfig() {
    var self = this instanceof inTestConfig ? this : new inTestConfig();
    self.isTesting =  true;
    self.breakOnSignal =  false;
    self.totalTests =  0;
    self.totalPass =  0;
    self.totalFail =  0;

    // Name of current test
    self.testName = '';
    
    // List of passing tests
    self.passedTests = [];

    // List of failed tests
    self.failedTests = [];

    return self;
}

inTestConfig.prototype.reportResults = function reportResults() {
    if(!this.isTesting) {
        return;
    }
    console.log('\n=================');
    console.log('\nFailing tests: ' + this.failedTests.length);
    this.failedTests.forEach(function (name) {
        console.log(name);
    });
    console.log('\nPassing tests: ' + this.passedTests.length);
    this.passedTests.forEach(function (name) {
        console.log('\t' + name);
    });
    console.log('\n=================');
    console.log('Total tests :' + this.totalTests);
    console.log('Total passed:' + this.totalPass);
    console.log('Total failed:' + this.totalFail);
    console.log('=================\n');
};

// Given a test name, expected value, compare theTest to expected.
inTestConfig.prototype.checkEq = function checkEq(testName, expect, theTest) {
    if(!this.isTesting) {
        return;
    }
    if(theTest === undefined) {
        console.log('undefined');
    }
    var detail = '\t' + lcl_utils.constantWidthString(testName, 30) +
            ' Expect: ' + lcl_utils.constantWidthString('' + expect, 10) +
            ' Received: ' + theTest;
    var pass_fail = 'PASS';
    this.testName = testName;
    this.totalTests += 1;
    if(expect === theTest) {
        this.totalPass += 1;
        this.passedTests.push(testName);
    } else {
        this.totalFail += 1;
        try{
            throw new Error('checkEq failed. Expected: ' + 
                    theTest + ' Received: ' + expect);
        } catch(err) {
            // This works in WebStorm! What's wrong with node????
            // Also works with node-debug inlineTest.js and the
            // browser breakpoint has the correct info!!!
            var trace = stackTrace.parse(err);
            var traceStr = '';
            for(var i = 0; i < 4; ++i) {
                traceStr += '       ' + 
                    trace[i].getFunctionName() + ' ' +
                    trace[i].getFileName() + ':' + 
                    trace[i].getLineNumber() + '\n';
            }
            this.failedTests.push('    '+ testName + 
                    '\n\t' + err + '\n' +
                    traceStr);
        }
        pass_fail = 'FAIL';
    } 
    console.log('\t' + pass_fail + ':' + detail);
};

/***
inTestConfig.prototype.checkNotEq = function checkNotEq(testName, expect, theTest) {
    if(!this.isTesting) {
        return;
    }
    this.testName = testName;
    this.totalTests += 1;
    var pass_fail = 'PASS';
    var detail = '    ' + testName +
            '\n    ' + 'Received:' + theTest +
            ' Expected: ' + expect + '\n' +
            '\n    ' + new Error().stack.split('\n')[2];
    if(expect === theTest) {
        this.totalFail += 1;
        this.failedTests.push(detail);
    } else {
        this.totalPass += 1;
        this.passedTests.push(testName);
        pass_fail = 'FAIL';
    }
    console.log('\t' + pass_fail + ':' + detail);
};
***/

// Given a test name, expect theTest to exist.
inTestConfig.prototype.checkExist = function checkExist(testName, theTest) {
    if(!this.isTesting) {
        return;
    }
    this.testName = testName;
    this.totalTests += 1;
    var pass_fail = 'PASS';
    var detail = '    ' + testName +
                '\n    ' + 'Received:' + theTest +
                '\n    ' + new Error().stack.split('\n')[2];
    if(lcl_utils.exists(theTest) === true) {
        this.totalPass += 1;
        this.passedTests.push(testName);
    } else {
        this.totalFail += 1;
        this.failedTests.push(detail);
        console.log('\t' + pass_fail + ':' + detail);
    }
};

inTestConfig.prototype.checkNotExist = function checkNotExist(testName, theTest) {
    if(!this.isTesting) {return;}
    this.testName = testName;
    this.totalTests += 1;
    if(lcl_utils.exists(theTest) === false) {
        this.totalPass += 1;
        this.passedTests.push(testName);
    } else {
        this.totalFail += 1;
        this.failedTests.push('    ' + testName +
                '\n    ' + 'Received:' + theTest +
                '\n    ' + new Error().stack.split('\n')[2]);
    }
};

inTestConfig.prototype.isFalsy = function isFalsy(val) {
    return val === false ||
        val === 0  ||
        val === -0 ||
        val === '' ||
        isNaN(val) ||
        val === null ||
        val === undefined;
};

inTestConfig.prototype.isTruthy = function isTruthy(val) {
    return !!val;
};

inTestConfig.prototype.checkFalsy = function checkFalsy(testName, theTest) {
    if(!this.isTesting) {return;}
    this.testName = testName;
    this.totalTests += 1;
    if(this.isFalsy(theTest) === true) {
        this.totalPass += 1;
        this.passedTests.push(testName);
    } else {
        this.totalFail += 1;
        this.failedTests.push('    ' + testName +
                '\n    ' + 'Received:' + theTest +
                '\n    ' + new Error().stack.split('\n')[2]);
    }
};

inTestConfig.prototype.checkTruthy = function checkTruthy(testName, theTest) {
    if(!this.isTesting) {return;}
    this.testName = testName;
    this.totalTests += 1;
    if(this.isTruthy(theTest) === true) {
        this.totalPass += 1;
        this.passedTests.push(testName);
    } else {
        this.totalFail += 1;
        this.failedTests.push('    ' + testName + 
                '\n    ' + 'Received:' + theTest +
                '\n    ' + new Error().stack.split('\n')[2]);
    }
};

inTestConfig.prototype.zeroCounts =  function zeroCounts() {
    if(!this.isTesting) {return;}
    this.totalTests = 0;
    this.totalPass = 0;
    this.totalFail = 0;
    this.passedTests = [];
    this.failedTests = [];
};

inTestConfig.prototype.usage = function usage() {
    if(!this.isTesting) {return;}
    console.log('inline testing utility usage\n\
        ...\n\
    To start:\n\
        var inTestConfig = require("inlineTest.js");\n\
        var itc = inTestConfig;\n\
        itc.isTesting = true;   // If inline testing desired.\n\
    or:\n\
        itc.isTesting = false;  // If inline testing NOT desired.\n\
                               // NO testing is the default.\n\
\n\
    Methods:\n\
\n\
    Truthy/Falsy:\n\
        itc.checkTruthy(msg, expression);\n\
        itc.checkFalsy(msg, expression);\n\
\n\
    Equality testing:\n\
        itc.checkEq(msg, expected, test_expression);\n\
        //itc.checkNotEq(msg, expected, test_expression);\n\
\n\
    Only undefined and null are considered not existing:\n\
        itc.checkExists(msg, test_expression);\n\
        itc.checkNotExists(msg, test_expression);\n');
};

// Local fcn to test the tester.
function selfTest() {
    var itc = inTestConfig();
    itc.isTesting = true;
    itc.totalTests += 1;
    itc.totalFail += 1;
    itc.zeroCounts();

    itc.usage();
    //
    // These tests should pass
    itc.checkEq('PASS: one eq one', 1, 1);
    itc.checkExist('PASS: true exists', true);
    itc.checkExist('PASS: false exists', false);
    itc.checkNotExist('PASS: undefined should not exist', undefined);
    itc.checkNotExist('PASS: null should not exist', null);
    itc.checkFalsy('PASS: false is falsy', false);
    itc.checkFalsy('PASS: 0 is falsy', 0);
    itc.checkFalsy('PASS: -0 is falsy', -0);
    itc.checkFalsy('PASS: \'\' is falsy', '');
    // V8 doesn't seem to think NaN is falsy. What gives?
    itc.checkFalsy('PASS: NaN is falsy', NaN);
    itc.checkFalsy('PASS: null is falsy', null);
    itc.checkFalsy('PASS: undefined is false', undefined);
    itc.checkTruthy('PASS: 1 is truthy', 1);
    itc.checkTruthy('PASS: {} is truthy', {});
    //
    // FORCING: These tests should expectedly fail.
    itc.checkEq('FORCED FAIL: bogus test', 2*3, 14);
    itc.checkNotExist('FORCED FAIL: {} should exist', {});
    itc.checkFalsy('FORCED FAIL: {} is not falsy', {});
    itc.checkTruthy('FORCED FAIL: 0 is not truthy', 0);

    itc.reportResults();
}

// Test the tester!
//selfTest();


function showTestEnv() {
    if(process.env.TESTING && process.env.TESTING === 'ALL') {
        console.log('TESTING=ALL means all selfTests will run');
        return;
    }

    if(process.env.TESTING && process.env.TESTING === 'NONE') {
        console.log('TESTING=NONE means *NO* selfTests will run');
        return;
    }

    var testEnv = lcl_utils.filterEnv('TEST');
    console.log('Possible TEST env settings:');
    console.log(inspect(testEnv));

    console.log('For each TEST:');
    for(var item in testEnv) {
        if(isSelfTesting(item)) {
            console.log('\ttesting\t' + item);
        } else {
            console.log('\tnot testing\t' + item);
        }
    }
}


module.exports.inTestConfig = inTestConfig;
module.exports.selfTest = selfTest;
module.exports.isSelfTesting = isSelfTesting;

/***
var testEnvs = lcl_utils.filterEnv('TEST');
if(testEnvs !== {}) {
    //console.log('Valid TEST keys:' + inspect(testEnvs));
    showTestEnv();
}
***/

if(process.env.TESTING === 'ALL') {
    selfTest();
}

/***
var rt = 'ROOM_TESTING';
var it = 'IJK_TESTING';
var ret = isSelfTesting(rt);
console.log('room_testing:' + ret);
ret = isSelfTesting(it);
console.log('itJK_testing:' + ret);
**/




