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
 */

var inspect = require('util').inspect;

/***************************************************************
// Another good stack tracer:
// Ref: http://stackoverflow.com/questions/14172455/get-name-and-line-of-calling-function-in-node-js
***************************************************************/


// Struct use to collect counts of all testing
function inTestConfig() {
    var self = this instanceof inTestConfig ? this : new inTestConfig();
    self.isTesting =  false;
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

// See: Prog JS Apps, Eric Elliott, p. 219
// For accessing the stack:
//     https://github.com/winstonjs/winston/issues/200
//
inTestConfig.prototype.exists = function exists(x) {
    return (x !== undefined && x !== null);
};

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
    if(!this.isTesting) {return;}
    this.testName = testName;
    this.totalTests += 1;
    if(expect !== theTest) {
        this.totalFail += 1;
        this.failedTests.push('    ' + testName + '\n    ' + new Error().stack.split('\n')[2]);
    } else {
        this.totalPass += 1;
        this.passedTests.push(testName);
    }
};

inTestConfig.prototype.checkNotEq = function checkNotEq(testName, expect, theTest) {
    if(!this.isTesting) {return;}
    this.testName = testName;
    this.totalTests += 1;
    if(expect === theTest) {
        this.totalFail += 1;
        this.failedTests.push('    ' + testName + '\n    ' + new Error().stack.split('\n')[2]);
    } else {
        this.totalPass += 1;
        this.passedTests.push(testName);
    }
};

// Given a test name, expect theTest to exist.
inTestConfig.prototype.checkExist = function checkExist(testName, theTest) {
    if(!this.isTesting) {return;}
    this.testName = testName;
    this.totalTests += 1;
    if(this.exists(theTest) === true) {
        this.totalPass += 1;
        this.passedTests.push(testName);
    } else {
        this.totalFail += 1;
        this.failedTests.push('    ' + testName + '\n    ' + new Error().stack.split('\n')[2]);
    }
};

inTestConfig.prototype.checkNotExist = function checkNotExist(testName, theTest) {
    if(!this.isTesting) {return;}
    this.testName = testName;
    this.totalTests += 1;
    if(this.exists(theTest) === false) {
        this.totalPass += 1;
        this.passedTests.push(testName);
    } else {
        this.totalFail += 1;
        this.failedTests.push('    ' + testName + '\n    ' + new Error().stack.split('\n')[2]);
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
        this.failedTests.push('    ' + testName + '\n    ' + new Error().stack.split('\n')[2]);
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
        this.failedTests.push('    ' + testName + '\n    ' + new Error().stack.split('\n')[2]);
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
        itc.checkNotEq(msg, expected, test_expression);\n\
\n\
    Only undefined and null are considered not existing:\n\
        itc.checkExists(msg, test_expression);\n\
        itc.checkNotExists(msg, test_expression);\n');
};

// Local fcn to test the tester.
function main() {
    var itc = inTestConfig();
    itc.isTesting = true;
    itc.totalTests += 1;
    itc.totalFail += 1;

    itc.usage();
    //
    // These tests should pass
    itc.checkEq('PASS: one eq one', 1, 1);
    itc.checkNotEq('PASS: 6 ne 14', 2*3, 14);
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
    // These tests should expectedly fail.
    itc.checkEq('expected to FAIL: bogus test', 2*3, 14);
    itc.checkNotEq('expected to FAIL: 14 does eq 14', 14, 14);
    itc.checkNotExist('expected to FAIL: {} should exist', {});
    itc.checkFalsy('expected to FAIL: {} is not falsy', {});
    itc.checkTruthy('expected to FAIL: 0 is not truthy', 0);

    itc.reportResults();
}

// Test the tester!
main();

module.exports.inTestConfig = inTestConfig;
module.exports.selfTest = main;




