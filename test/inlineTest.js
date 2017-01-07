/**
 * intest provides testing capabilities to test in the same
 * module as the code. This eases the requirement and overhead
 * of writing a mocha test in a separate testing module.
 * Additionally, intest permits WebStorm to debug easily
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


// See: Prog JS Apps, Eric Elliott, p. 219
// For accessing the stack:
//     https://github.com/winstonjs/winston/issues/200
//
function exists(x) {
    return (x !== undefined && x !== null);
}

// Struct use to collect counts of all testing
var inTestConfig = {
    isTesting:  false,
    breakOnSignal:  false,
    totalTests:  0,
    totalPass:  0,
    totalFail:  0,

    // Name of current test
    testName: '',
    
    // List of passing tests
    passedTests: [],

    // List of failed tests
    failedTests: [],

    reportResults: function reportResults() {
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
    },

    // Given a test name, expected value, compare theTest to expected.
    checkEq: function checkEq(testName, expect, theTest) {
        this.testName = testName;
        this.totalTests += 1;
        if(expect !== theTest) {
            this.totalFail += 1;
            this.failedTests.push('    ' + testName + '\n    ' + new Error().stack.split('\n')[2])
        } else {
            this.totalPass += 1;
            this.passedTests.push(testName);
        }
    },

    checkNotEq: function checkNotEq(testName, expect, theTest) {
        this.testName = testName;
        this.totalTests += 1;
        if(expect === theTest) {
            this.totalFail += 1;
            this.failedTests.push('    ' + testName + '\n    ' + new Error().stack.split('\n')[2])
        } else {
            this.totalPass += 1;
            this.passedTests.push(testName);
        }
    },

    // Given a test name, expect theTest to exist.
    checkExist: function checkExist(testName, theTest) {
        this.testName = testName;
        this.totalTests += 1;
        if(exists(theTest) === true) {
            this.totalPass += 1;
            this.passedTests.push(testName);
        } else {
            this.totalFail += 1;
            this.failedTests.push('    ' + testName + '\n    ' + new Error().stack.split('\n')[2])
        }
    },

    checkNotExist: function checkNotExist(testName, theTest) {
        this.testName = testName;
        this.totalTests += 1;
        if(exists(theTest) === false) {
            this.totalPass += 1;
            this.passedTests.push(testName);
        } else {
            this.totalFail += 1;
            this.failedTests.push('    ' + testName + '\n    ' + new Error().stack.split('\n')[2])
        }
    },

    zeroCounts:  function zeroCounts() {
        this.totalTests = 0;
        this.totalPass = 0;
        this.totalFail = 0;
    }
};

function usage() {
    console.log('inline testing utility usage\n\
    Equality testing:\n\
        checkEq(msg, expected, test_expression);\n\
        checkNotEq(msg, expected, test_expression);\n\
\n\
    Only undefined and null are considered not existing:\n\
        checkExists(msg, test_expression);\n\
        checkNotExists(msg, test_expression);\n');
}

// Local fcn to test the tester.
function main() {
    var it = inTestConfig;
    it.totalTests += 1;
    it.totalFail += 1;

    usage();
    //
    // These tests should pass
    it.checkEq('PASS: one eq one', 1, 1);
    it.checkNotEq('PASS: 6 ne 14', 2*3, 14);
    it.checkExist('PASS: true exists', true);
    it.checkExist('PASS: false exists', false);
    it.checkNotExist('PASS: undefined should not exist', undefined);
    it.checkNotExist('PASS: null should not exist', null);
    //
    // These tests should expectedly fail.
    it.checkEq('FAIL: bogus test', 2*3, 14);
    it.checkNotEq('FAIL: 14 does eq 14', 14, 14);
    it.checkNotExist('FAIL: {} should exist', {});

    it.reportResults();
    //console.log('config:' + inspect(it));
}

// Test the tester!
//main();

module.exports.inTestConfig = inTestConfig;
module.exports.usage = usage;




