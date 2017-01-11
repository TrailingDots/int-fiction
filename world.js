//
// Interactive fiction project
// To get all functions:   egrep "^fun|^[A-Z]" world.js
//
require("babel-register");   // xform by Babel all *.js
var assert = require('assert');
var inspect = require('util').inspect;
var R = require('ramda');
var util = require('util');

// Provide inline testing of code.
var inline = require('./lib/inlineTest.js');

// Effective JavaScript, p. 121
function Dict(elements) {
    var self = this instanceof Dict ? this : new Dict(elements);
    // Allow optional initial table.
    self.elements = elements || {}; // defaults to null object 
    self.hasSpecialProto = false;   // has "__proto__" key?
    self.specialProto = undefined;  // "__proto__" element
    return self;
}
Dict.prototype.has = function has(key) {
    if(key === "__proto__") {
        return this.hasSpecialProto;
    }
    // own property only
    return {}.hasOwnProperty.call(this.elements, key);
};
// If key not present, return default value.
// If no default value present, return undefined.
Dict.prototype.get = function get(key, defaultValue) {
    if(key === "__proto__") {
        return this.specialProto;
    }
    // own property only
    return this.has(key) ? this.elements[key] : defaultValue;
};
Dict.prototype.set = function set(key, val) {
    if(key === "__proto__") {
        this.hasSpecialProto = true;
        this.specialProto = val;
    } else {
        this.elements[key] = val;
    }
};

// Remove the key.
// Answers undefined even if key is not present. Standard JS!
// Answers the item if the key/value exists.
Dict.prototype.remove = function remove(key) {
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

Dict.prototype.selfTest = function selfTest() {
    // Test the Dict for corner cases.
    // Very unlikely a name of '__proto__' gets used, but handle it!
    // __proto__ insists on a special case for Dict

    var itc = inline.inTestConfig();
    itc.isTesting = true;
    itc.zeroCounts();
    var adict = Dict();
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


function Container (name) {
    'use strict';
    var self = this instanceof Container ? this : new Container(name);
    self.name = name || '';
    self.status = 'closed';

    // Contents of the room
    self.contents = Dict();

    return self;
}

/**
 * Given an item, determine if that item is in
 * the contents.
 *
 * @param item as cloned from the contents.
 * @return undefined if item not in player contents
 * @return cloned item if item is in player contents.
 */
Container.prototype.isCarrying = function isCarrying(item) {
    return this.contents.get(item.name);
};

Container.prototype.get = function get(item) {
    return this.contents.get(item.name);
};

Container.prototype.getByName = function getByName(name) {
    return this.contents.get(name);
};

// Answer true if OK, false otherwise
Container.prototype.take = function take(item) {
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
        this.contents.set(clonedItem.name, clonedItem);
    }
    return true;
};

// Drop an item.
// Return the item with decremented ount if multiple instances.
// If the item was dropped, return true.
// If the player does not have the item, return false. 
Container.prototype.drop = function drop(item) {
    var storedItem = this.isCarrying(item);
    if(!storedItem) {
        say(item.name + ' is not present.');
        return false;
    }
    if(storedItem.count > 1) {
        storedItem.count -= 1;
        return storedItem;
    }
    this.contents.remove(item.name);
    return true;
};

// Print the contents.
Container.prototype.inventory = function inventory() {
    say('Inventory:');
    for (var name in this.contents.elements) {
        if(this.contents.elements.hasOwnProperty(name)) {
            say('    ' + name);
        }
    }
    return true;
};

// Return the individual items as an array.
Container.prototype.inventoryList = function inventoryList() {
    var items = [];
    for (var name in this.contents.elements) {
        if(this.contents.elements.hasOwnProperty(name)) {
            items.push(this.contents.elements[name]);
        }
    }
    return items;
};

// Call this ONLY for a self-test.
Container.prototype.selfTest = function selfTest() {
    this.contents.selfTest();
};


function Player(name) {
    'use strict';
    var self = this instanceof Player ? this : new Player(name);
    self.name = name || 'Frobitz';  // default name of player
    self.description = 'You do not see anything special.';
    self.location = '';
    self.contents = Container(self.name);
    return self;
}

/**
 * Given an item, determine if that item is in
 * the contents.
 *
 * @param item as cloned from the contents.
 * @return undefined if item not in player contents
 * @return cloned item if item is in player contents.
 */
Player.prototype.isCarrying = function isCarrying(item) {
    return this.contents.isCarrying(item);
};

// Return an item in storage
Player.prototype.get = function get(item) {
    return this.contents.get(item);
};

// Return an item by name.
Player.prototype.getByName = function getByName(name) {
    return this.contents.getByName(name);
};

// Answer true if OK, false otherwise
Player.prototype.take = function take(item) {
    return this.contents.take(item);
};

// Drop an item.
Player.prototype.drop = function drop(item) {
    return this.contents.drop(item);
};


// Print the contents
Player.prototype.inventory = function inventory() {
    return this.contents.inventory();
};

// Return just the individual items of contents as an array.
Player.prototype.inventoryList = function inventoryList() {
    return this.contents.inventoryList();
};



function Item(name) {
    'use strict';
    var self = this instanceof Item ? this : new Item(name);
    self.name = name || '';
    self.description = 'You do not see anything special about ' + self.name;

    // Many items are movable. Some, like tables, cannot be carried.
    self.isMovable = true;

    // true if uniques only like beer. Gold is not unique.
    // When dropping/deleting this item, the count gets set to 0.
    self.isUnique = true;
    self.count = 0;
    //
    // Contents of the item (a player has a jacket. In that jacket is gold)
    self.contents = Container(self.name);

    self.weight = 1;
    self.close_description = 'You do not see anything special.';
    return self;
}

function Room(name) {
    'use strict';
    var self = this instanceof Room ? this : new Room(name);
    self.name = name || '';
    self.long_description = '';
    self.objects = {};

    // Map of exits. 
    // Key: the direction.
    // Value: the room name for that direction.
    self.exits = Dict();
    
    // Contents of the room
    self.contents = Container(self.name);
    
    return self;
}

Room.prototype.exitStrings = function exitStrings() {
    var results= [];
    var self = this;    // See: Effective JS, p. 100.
    Object.keys(this.exits.elements).forEach(function(key) {
        results.push(key + ': ' + self.exits.get(key));
    });
    return results;
};


// Add an exit to a room.
// Answer true if added.
Room.prototype.addExit = function addExit(dir, room) {
    var normDir = normalizeDirection(dir);
    if(normDir === undefined) {
        say(normDir + ' is not a valid direction');
        return undefined;
    }
    var item = this.exits.get(dir, undefined);
    if(item !== undefined) {
        // Th!s direction already used.
        say(normDir + ' is already in use.');
        return undefined;
    }
    // Safe to add item
    this.exits.set(normDir, room);
    return true;
};

Room.prototype.getExit = function getExit(dir) {
    var normDir = normalizeDirection(dir);
    if(normDir === undefined) {
        say(normDir + ' is not a valid direction');
        return undefined;
    }
    var item = this.exits.get(dir, undefined);
    if(item === undefined) {
        say('You can not go ' + dir);
        return undefined;
    }
    return item;
};

Room.prototype.selfTest = function selfTest() {
    console.log('\n------------------------------');
    console.log('    Testing the Room object');
    console.log('------------------------------\n');
    var itc = inline.inTestConfig();
    itc.isTesting = true;
    itc.zeroCounts();   // Clear counts for coverage report.
    var room = Room('closet');
    itc.checkEq('Adding w kitchen', true, room.addExit('w', 'kitchen'));
    itc.checkEq('Adding s bedroom', true, room.addExit('s', 'bedroom'));
    itc.checkEq('Adding n garden', true, room.addExit('n', 'garden'));
    itc.checkEq('w dir already used', undefined, room.addExit('w', 'pool'));
    itc.checkEq('w still used', undefined, room.addExit('w', 'garage'));
    var roomName = room.getExit('w');
    itc.checkEq('w room must be kitchen', 'kitchen', roomName);
    itc.checkEq('bogus room must be undefined', room.getExit('bogus'));
    var exStr = room.exitStrings();
    console.log("Room Exit strings:" + exStr);

    var room1 = Room('pool');
    itc.checkEq('unknown direction results in undefined', undefined, room1.getExit('n'));
    itc.checkEq('attempt to add bogus exit fails', undefined, room1.addExit('bogus', 'nowhere'));

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


module.exports.Player = Player;
module.exports.Item = Item;
module.exports.Container = Container;
module.exports.Room = Room;
module.exports.say = say;
module.exports.blank = blank;
module.exports.direction = direction;

// Below this the code gets used to provide
// a debugging platform because mocha does
// not allow an easy debugging environment.
// Code gets debugged from below here
// and moved to mocha testing. The code
// remains because further development
// can break existing tests.
function simpleMain() {
    var room = Room('qqqq');
    room.selfTest();
    var player = Player('xyzzy');
    var lantern = Item('lantern');
    var whiskey = Item('whiskey');
    whiskey.isUnique = false;
    var ax = Item('ax');
    player.take(ax);
    var ret = player.take(lantern);
    var itc = inline.inTestConfig();
    itc.exists('Empty obj exists', {});
    var playerLantern = player.isCarrying(lantern);
    itc.checkEq('player has lantern', lantern.name, player.isCarrying(lantern).name);
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

    newWhiskey = player.get(whiskey);
    itc.checkEq('container get()', 'whiskey', newWhiskey.name);

    ret = player.drop(whiskey);
    itc.checkEq('can drop 1 whiskey', 2, ret.count);

    var shovel = Item('shovel');
    itc.checkEq('Cannot drop what player does not have', false, player.drop(shovel));
    player.inventory();
    itc.reportResults();

    itc.zeroCounts();   // Clear counts for coverage report.
    itc.usage();        // Report for coverage.

    // Test the Dict structure
    player.contents.selfTest();

}
simpleMain();


/****
// Necessary vars for easy debugging.
var adict = Dict({
    alice: 34,
    bob: 24,
    chris: 62
});

var player = Player('xyzzy');
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


