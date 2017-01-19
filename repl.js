//
// A REPL for interactive fiction.
// Pure console operations.
//

// Initial configuration is a JSON script loaded to create the dungion.
//
// The the console takes input from users and executes through the
// dungeon.
//
var readline = require('readline');

var inspect = require('util').inspect;

var inspect = require('util').inspect;
var world = require('./new-world');
var lcl_utils = require('./lib/lcl_utils');

// Map of the world
var wm = require('./world-map');

// Current location of the player
// As a player goes from room to room,
// this gets updated.
var currentLocation = wm.startingRoom;

var commands = {
    $debug: function $debug() {
        debugger;
    },
    exits: function exits(args) {
        console.log('exits args:' + args);
        currentLocation.printAllExits(
                currentLocation.name + ' Room Exits');
    },
    // load a game file
    $load: function $load(args) {
        console.log('load a file:' + args);
    },
    help: function help (args) {
        console.log('help: ...');
    },
    go: function go (args) {
        console.log('current location:' + currentLocation.name);

        if(args.length < 2) {
            console.log('"go" command requires a direction: n,e,s,w');
            return;
        }
        var dir = world.normalizeDirection(args[1]);
        if(dir === undefined) {
            console.log('"' + args[1] + ': undefined direction');
        }

        console.log('Current location: ' + currentLocation.name);
        wm.player.movePlayer(currentLocation, dir);
        currentLocation = currentLocation.exits[dir];
        console.log('updated location:' + currentLocation.name);
    },
    look: function look(args) {
        console.log(currentLocation.description)
        currentLocation.printAllExits(
                currentLocation.name + ' Room Exits');
        currentLocation.printInventory('Room inventory');
    },
    examine: function examine(args) {
        console.log('examine' + args);
    },
    take: function take(args) {
        console.log('take' + args);
    },
    drop: function drop(args) {
        console.log('drop' + args);
    },
    inventory: function inventory(args) {
        // Using the room the player is in, print inventory
        currentLocation.printInventory('room inventory');
    },
    verbs: function verbs(args) {
        console.log(' in verbs: ' + inspect(cmdList(commands)));
        cmdList(commands);
    }
};

// From commands, extract the names of each cmd.
function cmdList(cmds) {
    cmds = cmds || commands;
    return Object.keys(cmds);
}

// Split the input line by spaces
function parseInput(answer) {
    return answer.split(' ');
}

var readline = require('readline');
var log = console.log;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var lineNumber = 1;
var allCmds = cmdList(commands);

console.log('allCmds: ' + inspect(allCmds));
var ret = 'look' in allCmds;
console.log('in allcmds:' + ret);

function validCmd(cmd, allCommands) {
    var keys = Object.keys(allCommands);
    for(var ndx = 0; ndx < keys.length; ++ndx) {
        if(cmd === keys[ndx]) {
            return true;
        }
    }
    return false;
}

var recursiveAsyncReadLine = function () {
    var leader = lineNumber.toString() + '> ';
    rl.question(leader, function (answer) {
    lineNumber += 1;

    if (answer == 'quit') { //we need some base case, for recursion
        return rl.close(); //closing RL and returning from function.
    }
    var cmd = parseInput(answer);
    console.log('split answer:' + inspect(cmd));

    // Map input to command and execute it.
    if(validCmd(cmd[0], commands)) {
        //console.log(cmd + ' is valid. Now exec the cmd:');
        commands[cmd[0]](cmd);
    } else {
        console.log(cmd[0] + ' -> an unknown command');
    }

    //log('Got it! Your answer was: "', answer, '"');

    //Calling this function again to ask new question
    recursiveAsyncReadLine(); 
    });
};

recursiveAsyncReadLine(); //we have to actually start our recursion somehow

function singleCmd(cmds) {
    var cmd = parseInput(cmds)
    // Map input to command and execute it.
    if(validCmd(cmd[0], commands)) {
        //console.log(cmd + ' is valid. Now exec the cmd:');
        commands[cmd[0]](cmd);
    } else {
        console.log(cmd[0] + ' -> an unknown command');
    }
}

singleCmd('inventory');


