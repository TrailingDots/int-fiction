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
var fs = inspect('fs');
var CircularJSON = require('circular-json');
var inspect = require('util').inspect;
var world = require('./new-world');
var lcl_utils = require('./lib/lcl_utils');
var util = require('util');
var ro = require('./lib/reportObject');

// Map of the world
var wm = require('./world-map');

// Current location of the player
// As a player goes from room to room,
// this gets updated.
var currentLocation = wm.startingRoom;

var commands = {
    $debug: function $debug() {
        debugger; // HANGS node!!!!
    },
    AllObjects: function AllObjects(args) {
        console.log('AllObjects:' + args);
        if(args.length == 1) {
            // Detailed list of all objects in this world.
            console.log(inspect(world.AllObjects.elements, {showHidden: false, depth: 2}));
        } else {
            if(args.length == 2) {
                var subCmd = args[1];
                if(subCmd === 'keys') {
                    console.log('AllObject subcommand keys:')
                    console.log(Object.keys(world.AllObjects.elements));
                }
            }
        }
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
        //console.log('current location:' + currentLocation.name);

        if(args.length < 2) {
            console.log('"go" command requires a direction: n,e,s,w');
            return;
        }
        var dir = world.normalizeDirection(args[1]);
        if(dir === undefined) {
            console.log('"' + args[1] + ': undefined direction');
            return;
        }

        var ret = wm.player.movePlayer(currentLocation, dir);
        if(!ret) {
            throw 'ERROR: Cannot move player, but exit exists';
        }

        currentLocation = currentLocation.exits[dir];
        console.log('At location:' + currentLocation.name);
        this.look();
    },
    look: function look(args) {
        console.log(currentLocation.description)
        currentLocation.printAllExits(
                currentLocation.name + ' Exits');
        currentLocation.printInventory('Room inventory');
    },
    examine: function examine(args) {
        console.log('examine:' + args);
    },
    take: function take(args) {
        //console.log('take args:' + inspect(args));
        //console.log('take:' + args);
        // Insist that the named item be in the inventory
        // of this room.
        var invList = currentLocation.inventoryList();
        //console.log('room inventory:' + inspect(invList));
        var invArray = invList.filter(function(item) {
            return item.name === args[1];
        });
        if(invArray.length === 0) {
            console.log(args[1] + ' not present!');
            return false;
        }

        var player = wm.player;
        player.take(invArray[0]);              // player takes item
        currentLocation.drop(invArray[0]);     // room drops item
        return true;
    },
    drop: function drop(args) {
        // player drop item, room takes it.
        //console.log('drop:' + args);
        var player = wm.player;

        var invList = player.inventoryList();
        //console.log('room inventory:' + inspect(invList));
        var invArray = invList.filter(function(item) {
            return item.name === args[1];
        });
        if(invArray.length === 0) {
            console.log(args[1] + ' not present!');
            return false;
        }
        player.drop(args[1]);
        currentLocation.take(invArray[0]);
        return true;
    },
    inventory: function inventory(args) {
        wm.player.printInventory('room inventory');
    },
    save: function save(args) {
        var fs = require('fs');         // Terribly inefficient!
        console.log('save: ' + args);
        console.log('world.AllObjects:' + world.AllObjects);
        fs.writeFile('all.json',               // filename
            CircularJSON.stringify(world.AllObjects),  // data object
            "utf8",                            // encoding
            function (err) {                   // callback
                if(err) {
                    return console.log(err);
                }
                 console.log('Persisting completed.');
                 return true; 
            })
    },

    load: function load(args) {
        var fs = require('fs');         // Terribly inefficient!
        console.log('save: ' + args);
        console.log('world.AllObjects:' + world.AllObjects);
        var jsonData = fs.readFile('all.json');
        world.AllObjects = CircularJSON.parse(jsonData);
        console.log('DONE: unserialized load')
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

/***
console.log('allCmds: ' + inspect(allCmds));
var ret = 'look' in allCmds;
console.log('in allcmds:' + ret);
***/

function validCmd(cmd, allCommands) {
    var keys = Object.keys(allCommands);
    for(var ndx = 0; ndx < keys.length; ++ndx) {
        if(cmd === keys[ndx]) {
            return true;
        }
    }
    return false;
}

var fs = require('fs');
var recursiveAsyncReadLine = function () {
    var leader = lineNumber.toString() + '> ';
    rl.question(leader, function (answer) {
        lineNumber += 1;

        if (answer == 'quit' || answer == 'exit') {
            return rl.close(); //closing RL and returning from function.
        }
        var cmd = parseInput(answer);

        // Map input to command and execute it.
        if(validCmd(cmd[0], commands)) {
            // Log all valid commands. Ignore bogus commands.
            var logStream = fs.open('repl.log', 'a', 666, function(e, id) {
                fs.write(id, lineNumber + ': ' + cmd.join(' ') + '\n', 
                    null, 'utf8', function() {
                    fs.close(id, function() {});
                })
            });
            commands[cmd[0]](cmd);
        } else {
            console.log(cmd[0] + ' => an unknown command');
        }

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

//singleCmd('inventory');
//singleCmd('go north');
//singleCmd('take beer');


