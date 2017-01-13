//
// Interactive fiction project
// To get all functions:   egrep "^fun|^[A-Z]" world.js
//
require("babel-register");   // xform by Babel all *.js
var assert = require('assert');
var inspect = require('util').inspect;
var R = require('ramda');
var util = require('util');
var reportObject = require('./lib/reportObject');

// Provide inline testing of code.
var inline = require('./lib/inlineTest.js');

// Effective JavaScript, p. 121
var Dict = Object.create({});
Dict.init = function init() {
    this.elements = {};
    this.hasSpecialProto = false;   // has "__proto__" key?
    this.specialProto = undefined;  // "__proto__" element
};
Dict.has = function has(key) {
    if(key === "__proto__") {
        return this.hasSpecialProto;
    }
};

// If key is present, return the value.
// If key not present, return default value.
// If no default value in args, return undefined.
Dict.get = function get(key, defaultValue) {
    if(key === "__proto__") {
        return this.specialProto;
    }
    // own property only
    return this.elements[key] ? this.elements[key] : defaultValue;
};
// Set a key in Dic to val.
// Always answers val.
Dict.set = function set(key, val) {
    if(key === "__proto__") {
        this.hasSpecialProto = true;
        this.specialProto = val;
    } else {
        this.elements[key] = val;
    }
    return val;
};

// Remove the key.
// Answers undefined even if key is not present. Standard JS!
// Answers the item if the key/value exists.
Dict.remove = function remove(key) {
    if(key === "__proto__") {
        this.hasSpecialProto = false;
        this.specialProto = undefined;
    } else {
        var item = this.elements[key];
        delete this.elements[key];
        return item;
    }
    return undefined;
};

Dict.selfTest = function selfTest() {
    console.log('\n==================================');
    console.log('     Test the Dict for corner cases.');
    console.log('====================================');
    // Test the Dict for corner cases.
    // Very unlikely a name of '__proto__' gets used, but handle it!
    // __proto__ insists on a special case for Dict

    if(!process.env.DICT_TESTING) {
        return;
    }
    var itc = inline.inTestConfig();
    itc.zeroCounts();
    var adict = Object.create(Dict);
    adict.init();
    console.log('\n------------------------------');
    console.log('    Testing the Dict object');
    console.log('------------------------------\n');
    itc.checkEq('no proto, yet', undefined, adict.get('__proto__'));
    itc.checkEq('default proto:9876', adict.get('__proto__', 9876));
    itc.checkEq('setting proto to 1234', undefined, adict.set('__proto__', 1234));
    itc.checkEq('found proto', 1234, adict.get('__proto__'));
    itc.checkEq('removing proto', undefined, adict.remove('__proto__'));
    itc.checkEq('ensure no proto', undefined, adict.get('__proto__'));

    itc.checkEq('insert __proto__ is OK', 'ok-proto', adict.set('__proto__', 'ok-proto'));
    itc.checkEq('check the has() for __proto__', true, adict.has('__proto__'));
    itc.checkEq('can retrieve __proto__', 'ok-proto', adict.get('__proto__'));

    itc.reportResults();
    itc.zeroCounts();
    console.log('------------------------------------');
    console.log('    end of Testing the Dict object');
    console.log('------------------------------------\n');
};


// Answers with a new instance of Container.
// Most parts of the game have a Container of some sort.
// The contents of a Container has only Item instances.
// A table can have candles, gold and food. 
var Container = Object.create(Dict);
Container.init = function (name) {
    Dict.init();
    this.name = name || 'xyzzy';
};

/**
 * Given an item, determine if that item is in
 * the contents.
 *
 * @param item as cloned from the contents.
 * @return undefined if item not in player contents
 * @return cloned item if item is in player contents.
 */
Container.isCarrying = function isCarrying(item) {
    if(item === undefined) {
        return undefined;
    }
    return this.get(item.name);
};

Container.isCarryingByName = function isCarrying(itemName) {
    return this.get(itemName);
};

Container.getByName = function getByName(name) {
    return this.get(name);
};

// Answer true if OK, false otherwise
Container.take = function take(item) {
    if(item === undefined) {
        return false;
    }
    if(!item.isMovable) {
        say("This item cannot be moved.");
        return false;
    } 
    var carryItem = this.isCarrying(item);

    if(carryItem) {
        // Already have this item, ensure multiples OK
        if(carryItem.isUnique) {
            say('This item is already with the player');
            return false;   
        }
        carryItem.count += 1;
    } else {
        // Save a clone and NOT the item reference!
        var clonedItem = R.clone(item);
        clonedItem.count += 1;
        console.log('cloned saved, count:' + clonedItem.count);
        this.set(clonedItem.name, clonedItem);
    }
    return true;
};

// Drop an item.
// Return the item with decremented count if multiple instances.
// If the item was dropped, return true.
// If the player does not have the item, return false. 
// TODO: Need a routine to drop the item if the count > 0, such as beer.
Container.drop = function drop(item) {
    var storedItem = this.isCarrying(item);
    if(!storedItem) {
        if(item) {
            say(item.name + ' is not present.');
        } else {
            say('"undefined item" is not present.');
        }

        return false;
    }
    if(storedItem.count > 1) {
        storedItem.count -= 1;
        return storedItem;
    }
    this.remove(item.name);
    return true;
};

Container.dropByName = function dropByName(itemName) {
    var storedItem = this.isCarryingByName(itemName);
    return this.drop(storedItem);
};


// Print the contents.
Container.inventory = function inventory() {
    say('Inventory:');
    for (var name in this.elements) {
        if(this.elements.hasOwnProperty(name)) {
            say('    ' + name);
        }
    }
    return true;
};

// Return the individual items as an array.
Container.inventoryList = function inventoryList() {
    var items = [];
    for (var name in this.elements) {
        if(this.elements.hasOwnProperty(name)) {
            items.push(this.elements[name]);
        }
    }
    return items;
};

// Call this ONLY for a self-test.
Container.selfTest = function selfTest() {
    Dict.selfTest();
};

// Answers a new instance of a Player.
var Player = Object.create(Container);
Player.playerSetup = function (name, description) {
    'use strict';
    Container.init();
    this.init();
    this.name = name || 'Frobitz';  // default name of player
    this.description = 'You do not see anything special.';
};

var aplayer = Object.create(Player);
aplayer.init('Dudly DoRight', 'The good fellow');
console.log('============== Player =============');
reportObject.reportObject(aplayer, '', 3, 5);

// An Item gets placed into the contents of something.
// E.g.: A candle onto a table, gold into a Player's pocket.
// The contents dict contains instances of Item. Each Item
// has a name.
var Item = Object.create(Container);
Item.init = function init(name, description) {
    'use strict';
    // Delegated call
    Container.init();
    this.name = name || '';
    this.description = description || ('You do not see anything special about ' + this.name);

    // Many items are movable. Some, like tables, 
    // cannot be carried.
    this.isMovable = true;

    // true if uniques only like beer. Gold is not unique.
    // When dropping/deleting this item, the count gets 
    // set to 0.
    this.isUnique = true;
    this.count = 0;

    this.weight = 1;
};


var Room = Object.create(Container);
Room.init = function init(name, description) {
    'use strict';
    Container.init();
    this.name = name || '';
    this.long_description = description || 'A dull room';

    // Map of exits. 
    // Key: the direction.
    // Value: the room name for that direction.
    this.exits = {};
};

Room.exitStrings = function exitStrings() {
    var results= [];
    var self = this;    // Better: See: Effective JS, p. 100.
    for(var anExit in this.exits) {
        if(this.elements.hasOwnProperty(anExit)) {
            results.push(key + ': ' + self.exits[anExit]);
        }
    };
    return results;
};


// Add an exit to a room.
// Answer true if added.
Room.addExit = function addExit(dir, room) {
    var normDir = normalizeDirection(dir);
    if(normDir === undefined) {
        say(normDir + ' is not a valid direction');
        return undefined;
    }
    var item = this.exits[dir];
    if(item !== undefined) {
        // Th!s direction already used.
        say(normDir + ' is already in use.');
        return undefined;
    }
    // Safe to add item
    this.exits[normDir] = room;
    return true;
};

// Answer the value of a specific exit in a room.
Room.getExit = function getExit(dir) {
    var normDir = normalizeDirection(dir);
    if(normDir === undefined) {
        say(normDir + ' is not a valid direction');
        return undefined;
    }
    var item = this.exits[dir];
    if(item === undefined) {
        say('You can not go ' + dir);
        return undefined;
    }
    return item;
};

Room.selfTest = function selfTest() {
    if(!process.env.ROOM_TESTING) {
        return;
    }

    console.log('\n------------------------------');
    console.log('    Testing the Room object');
    console.log('------------------------------\n');
    var itc = inline.inTestConfig();
    itc.isTesting = true;
    itc.zeroCounts();   // Clear counts for coverage report.
    var room = Object.create(Room);
    room.init('closet');
    var kitchen = Object.create(Room);
    kitchen.init('kitchen');
    var bedroom = Object.create(Room);
    bedroom.init('bedroom');
    var garden = Object.create(Room);
    garden.init('garden');
    var pool = Object.create(Room);
    pool.init('pool');
    var garage = Object.create(Room);
    garage.init('garage');
    itc.checkEq('Adding w kitchen', true, room.addExit('w', kitchen));
    itc.checkEq('Adding s bedroom', true, room.addExit('s', bedroom));
    itc.checkEq('Adding n garden', true, room.addExit('n', garden));
    itc.checkEq('w dir already used', undefined, room.addExit('w', pool));
    itc.checkEq('w still used', undefined, room.addExit('w', garage));
    var roomName = room.getExit('w');
    itc.checkEq('w room must be kitchen', 'kitchen', roomName);
    itc.checkEq('bogus room must be undefined', room.getExit('bogus'));
    var exStr = room.exitStrings();
    console.log("Room Exit strings:" + exStr);

    var room1 = Object.create(Room);
    room1.init('pool');
    itc.checkEq('unknown direction results in undefined', undefined, room1.getExit('n'));
    itc.checkEq('attempt to add bogus exit fails', undefined, room1.addExit('bogus', 'nowhere'));

    // Test for all "byName" fcns
    var beer = Object.create(Item);
    beer.init('beer');
    var gold = Object.create(Item);
    gold.init('gold');

    var player = Object.create(Player);
    player.init('byName');
    var ret = player.take(beer);

    itc.checkEq('byName takes beer', true, player.take(beer));
    itc.checkEq('byName takes gold', true, player.take(gold));
    var beerCarrier = player.isCarryingByName('beer');
    console.log('beerCarrier:' + inspect(beerCarrier));
    itc.checkEq('byName isCarrying beer', 'beer', beerCarrier.name);
    itc.checkEq('byName isCarrying foobar', undefined, player.isCarryingByName('foobar'));
    itc.checkEq('byName isCarrying beer', 'beer', player.isCarryingByName('beer').name);
    itc.checkEq('byName beer count must be 1', 1, player.isCarryingByName('beer').count);

    itc.reportResults();
    itc.zeroCounts();   // Clear counts for coverage report.
    console.log('------------------------------------');
    console.log('    end of Testing the Room object');
    console.log('------------------------------------\n');
};

function normalizeDirection(dir) {
    'use strict';
    // A list directions. Aliases may be used. An alias gets mapped to
    // a standard direction.
    var standard = {
        'u': 'u',
        'up': 'u',
        'd': 'd',
        'down': 'd',
        'n': 'n', 
        'north': 'n',
        'e': 'e', 
        'east': 'e',
        's': 's',
        'south': 's',
        'w': 'w', 
        'west': 'w'};
    // Given a direction as a string, map to a standard name.
    var lcDir = dir.toLowerCase();
    if(lcDir in standard) {
        return standard[lcDir];
    }
    return undefined;   // Illegal dir
}

function say(things) {
    'use strict';
    console.log(things);
}

function blank() {
    'use strict';
    console.log('\n');
}

function direction() {
       // Fix me
}


// Below this the code gets used to provide
// a debugging platform because mocha does
// not allow an easy debugging environment.
// Code gets debugged from below here
// and moved to mocha testing. The code
// remains because further development
// can break existing tests.
function simpleMain() {
    if( !process.env.SIMPLE_MAIN_TESTING) {
        return;
    }
    var room = Object.create(Room);
    room.init('qqq');

    room.selfTest();

    var player = Object.create(Player);
    player.init('xyzzy');

    var lantern = Object.create(Item);
    lantern.init('lantern');

    var whiskey = Object.create(Item);
    whiskey.init('whiskey');
    whiskey.isUnique = false;

    var ax = Object.create(Item);
    ax.init('ax');

    player.take(ax);
    var ret = player.take(lantern);
    var itc = inline.inTestConfig();
    itc.exists('Empty obj exists', {});
    var playerLantern = player.isCarrying(lantern);
    itc.checkEq('player has lantern', lantern.name, player.isCarrying(lantern).name);
    itc.checkEq('player has container lantern', lantern.name, player.isCarrying(lantern).name);
    console.log('ret=' + ret + ' player takes lantern');
    itc.checkEq('player does not carry whiskey', 
            undefined, player.isCarrying(whiskey));
    itc.checkEq('fails attempt to carry another lantern.',
            false, player.take(lantern));
    itc.checkExist('carry ax', player.take(ax));
    var items = player.inventoryList();
    var ax_item = items.filter(function (item) {
        return item.name === ax.name;
    });
    //filter() always returns an array
    itc.checkEq('filters to ax', true, util.isArray(ax_item));
    // Array of length 1
    itc.checkEq('only one ax', 1, ax_item.length);
    itc.checkEq('verify names of ax', ax.name, ax_item[0].name);

    // Add some more whiskey
    player.take(whiskey);
    player.take(whiskey);
    player.take(whiskey);
    var newWhiskey = player.getByName('whiskey');
    console.log('whiskey count:' + newWhiskey.count);
    itc.checkEq('have 3 whiskey', 3, newWhiskey.count);

    newWhiskey = player.take(whiskey);
    itc.checkEq('container get()', 'whiskey', newWhiskey.name);

    ret = player.drop(whiskey);
    itc.checkEq('can drop 1 whiskey', 2, ret.count);

    var shovel = Object.create(Item);
    shovel.init('shovel');

    itc.checkEq('Cannot drop what player does not have', false, player.drop(shovel));
    player.inventory();
    itc.reportResults();


    var chair = Object.create(Item);
    chair.init('chair');

    var table = Object.create(Item);
    table.init('table');

    var stool = Object.create(Item);
    stool.init('stool');

    room = Object.create(Room);
    room.init('room');

    var garden = Object.create(Room);
    garden.init('garden');

    room.addExit('n', garden);
    garden.addExit('s', room);
    itc.checkEq('room n is garden', 'garden', room.getExit('n').name);
    itc.checkEq('garden s is room', 'room', garden.getExit('s').name);
    itc.checkEq('room e is undefined', undefined, room.getExit('e'));

    itc.checkEq('take chair', true, room.take(chair));
    var roomTable = room.take(table);
    itc.checkEq('take table', true, roomTable);
    itc.checkEq('carrying chair',  'chair', room.isCarryingByName('chair').name);
    var atable = room.isCarryingByName('table');
    itc.checkEq('carrying table', true, atable);
    atable =  room.getByName('table');
    itc.checkEq('can get table', 'table', atable.name);
    room.take(table);
    itc.checkEq('dropping table', true, room.drop('table'));
    itc.checkEq('not carrying table', false, room.isCarryingByName('table').name);

    itc.checkEq('room has north exit free', undefined, room.getExit('n'));

    itc.zeroCounts();   // Clear counts for coverage report.
    itc.usage();        // Report for coverage.

    // Test the Dict structure
    player.selfTest();

}
simpleMain();


/****
// Necessary vars for easy debugging.
var adict = Dict({
    alice: 34,
    bob: 24,
    chris: 62
});

var player = new Player('xyzzy');
var ax = Item('ax');
var table = Item('table');
table.isUnique = true;
var door = Item('door');
door.isUnique = true;
var beer = Item('beer');
beer.isUnique = false;  // Many bottles of beer OK
var gold = Item('gold');
gold.isUnique = false;  // lots of gold OK
player.take(ax);
player.take(ax);    // only one ax allowed
player.take(beer);
player.take(beer);  // mulitple beer allowed
player.take(table); // does not happen.
***/


/**************** Self Testing **********
To perform internal selfTest:
export  DICT_TESTING=1
export  ROOM_TESTING=1
export  SIMPLE_MAIN_TESTING=1

export  DICT_TESTING=1 ROOM_TESTING=1 SIMPLE_MAIN_TESTING=1
unset DICT_TESTING ROOM_TESTING SIMPLE_MAIN_TESTING
**********************************************/

module.exports.Player = Player;
module.exports.Item = Item;
module.exports.Room = Room;
module.exports.say = say;
module.exports.blank = blank;
module.exports.direction = direction;

