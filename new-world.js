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

// Misc utility fcns
function say(things) {
    'use strict';
    console.log(things);
}

function blank() {
    'use strict';
    console.log('\n');
}

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
    // own property only.
    return this.hasOwnProperty.call(this.elements, key);
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

// Answers a list of keys in the dictionary.
Dict.keys = function keys() {
    var items = [];
    for (var name in this.elements) {
        if(this.elements.hasOwnProperty(name)) {
            items.push(this.elements[name]);
        }
    }
    return items;
};

Dict.selfTest = function () {
    if(!process.env.DICT_TESTING) {
        return;
    }
    console.log('\n==================================');
    console.log('     Test the Dict for corner cases.');
    console.log('====================================');
    // Test the Dict for corner cases.
    // Very unlikely a name of '__proto__' gets used, but handle it!
    // __proto__ insists on a special case for Dict

    // Provide inline testing of code.
    var inline = require('./lib/inlineTest.js');

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

    // Add some entries to the dict
    adict.set('key1', 'val1');
    adict.set('key2', 'val2');
    adict.set('key3', 'val3');

    var keys = adict.keys();
    //console.log('keys:' + inspect(keys));
    itc.checkEq('key1 is in keys', true, 'key1' in keys);
    itc.checkEq('key2 is in keys', true, 'key2' in keys);
    itc.checkEq('key3 is in keys', true, 'key3' in keys);
    itc.checkEq('length of keys is 3', 3, keys.length);

    // Ensure no __prototype__ exists for element
    itc.exists( ! adict.elements.__prototype__);

    // get specific keys
    itc.checkEq('get key1 value', 'val1', adict.get('key1'));
    
    // Check default setting.
    itc.checkEq('check default', 'qwerty', adict.get('bogus', 'qwerty'));
    itc.checkEq('default ignored for existing key', 'val1', adict.get('key1', 'qwerty'));

    // check has()
    itc.checkEq('key1 exists', true, adict.has('key1'));
    itc.checkEq('bogus does not exist', false, adict.has('bogus'));
    
    itc.reportResults();
    itc.zeroCounts();
    console.log('------------------------------------');
    console.log('    end of Testing the Dict object');
    console.log('------------------------------------\n');
};
Dict.selfTest();


// Answers with a new instance of Container.
// Most parts of the game have a Container of some sort.
// The contents of a Container has only Item instances.
// A table can have candles, gold and food. 
var Container = Object.create(Dict);
Container.init = function (name) {
    Dict.init();
    this.name = name || 'xyzzy';
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


/**
 * Given an item, determine if that item is in
 * the contents.
 *
 * @param item as cloned from the contents.
 * @return false if item not in container
 * @return true is item.name in container.
 */
Container.isCarrying = function isCarrying(item) {
    if(item === undefined) {
        return false;
    }
    var name = (typeof item === 'string') ? item : item.name;
    return this.has(name);
};

Container.get = function get(item) {
    var name = (typeof item === 'string') ? item : item.name;
    return Dict.get(name);
};

// Answer true if OK, false otherwise
Container.take = function take(item) {
    if(item === undefined) {
        return false;
    }

    var name = (typeof item === 'string') ? item : item.name;

    if(!item.canCarry) {
        say(name + "  cannot be moved.");
        return false;
    } 
    var isPresent = this.isCarrying(name);

    var currItem;
    if(isPresent) {
        // Already have this item, ensure multiples OK
        currItem = this.get(name);
        if(currItem.onlySingle) {
            say(name + ' is already in the container');
            return false;   
        }
    } else {
        currItem = item;
    }
    // Save a clone and NOT the item reference!
    // If the item exists, inc in the Dict to prevent
    // shadows. See p. 90, This & Object Prototypes
    var clonedItem = R.clone(currItem);
    clonedItem.count += 1;
    console.log(clonedItem.name + ' clone saved, count:' + clonedItem.count);
    this.set(clonedItem.name, clonedItem);
    return true;
};

// Drop an item.
// Return the item with decremented count if multiple instances.
// If the item was dropped, return true.
// If the player does not have the item, return false. 
// TODO: Need a routine to drop the item if the count > 0, such as beer.
Container.drop = function drop(item) {
    if(item === undefined) {
        return false;
    }
    var name = (typeof item === 'string') ? item : item.name;
    var isStored = this.isCarrying(name);
    if(!isStored) {
        if(item) {
            say(name + ' is not present.');
        } else {
            say('"undefined item" is not present.');
        }

        return false;
    }
    var storedItem = this.get(name);
    if(storedItem.count > 1) {
        storedItem.count -= 1;
        return true;
    }
    console.log('drop count:' + storedItem.count);
    this.remove(name);
    return true;
};

// Call this ONLY for a self-test.
// This selfTest will be extended when Item
// is completed. A Container will examine
// the items placed inside the container.
Container.selfTest = function () {
    if(!process.env.CONTAINER_TESTING) {
        return;
    }
    console.log('\n==================================');
    console.log('     Test the Container.');
    console.log('====================================');

    // Provide inline testing of code.
    var inline = require('./lib/inlineTest.js');
    var itc = inline.inTestConfig();
    itc.zeroCounts();

    var container = Object.create(Container);
    container.init('testContainer');

    var ret = container.set('key1', 'val1');
    ret = container.set('key2', 'val2');
    ret = container.set('key3', 'val3');
    itc.checkEq('set key1 to val1', 'val1', container.set('key1', 'val1'));
    itc.checkEq('get key1', 'val1', container.get('key1', 'val1'));
    var aList = container.inventoryList();
    container.inventory();


    itc.reportResults();
    itc.zeroCounts();
    console.log('------------------------------------');
    console.log('    end of Container selfTest');
    console.log('------------------------------------\n');
};
Container.selfTest();

// An Item gets placed into the contents of something.
// E.g.: A candle onto a table, gold into a Player's pocket.
// The contents dict contains instances of Item. Each Item
// has a name.
var Item = Object.create({});
Item.init = function init(name, description) {
    'use strict';
    // Delegated call
    Container.init();
    this.name = name || '';
    this.description = description || ('You do not see anything special about ' + this.name);

    // Many items can be carried. 
    // Some, like tables, cannot be carried.
    this.canCarry = true;

    // true if uniques only like beer. Gold is not unique.
    // When dropping/deleting this item, the count gets 
    // set to 0.
    this.onlySingle = true;
    this.count = 0;

    this.weight = 1;
};
Item.selfTest = function () {
    if(!process.env.ITEM_TESTING) {
        return;
    }
    console.log('\n==================================');
    console.log('     Test the Item.');
    console.log('====================================');
    var inline = require('./lib/inlineTest.js');

    var itc = inline.inTestConfig();
    itc.isTesting = true;
    itc.zeroCounts();

    var item = Object.create(Item);
    
    // Create some objects.
    var ax = Object.create(Item);
    ax.init('ax');

    var table = Object.create(Item);
    table.init('table');
    table.onlySingle = true;
    table.canCarry = false;

    var door = Object.create(Item);
    door.init('door');
    door.onlySingle = true;
    door.canCarry = false;

    var beer = Object.create(Item);
    beer.init('beer');
    beer.onlySingle = false;  // Many bottles of beer OK

    var gold = Object.create(Item);
    gold.init('gold');
    gold.onlySingle = false;  // lots of gold OK

    itc.checkEq('table is unique', true, table.onlySingle);
    itc.checkEq('gold is not unique', false, gold.onlySingle);
    itc.checkEq('gold is movable', true, gold.canCarry);
    itc.checkEq('table is not movable', false, table.canCarry);

    console.log(' Use a container and continue the Container selfTest.');
    var container = Object.create(Container);
    container.init();

    itc.checkEq('take gold.', true, container.take(gold));
    itc.checkEq('multiple gold OK.', true, container.take(gold));
    itc.checkEq('have 2 pieces of gold', 2, container.get('gold').count);
    itc.checkEq('orig gold has 0 count', 0, gold.count);

    console.log(' Now drop 1 piece gold');
    var ret = container.get('gold');
    console.log('gold count:' + container.get('gold').count);
    ret = container.isCarrying('gold');
    itc.checkEq('carrying gold', true, container.isCarrying('gold'));

    ret = container.drop(gold);
    itc.checkEq('have gold, dropped 1 piece', true, container.isCarrying('gold'));
    itc.checkEq('carrying 1 piece gold', true, container.isCarrying('gold'));
    console.log('gold count:' + container.get('gold').count);

    ret = container.drop(gold);
    itc.checkEq('carrying gold', false, container.isCarrying('gold'));

    ret = container.take(table);
    itc.checkEq('take a table', 
            false, container.take(table));
    itc.checkEq('Cannot take more than one table.', 
            false, container.take(table));


    itc.reportResults();
    itc.zeroCounts();
    console.log('------------------------------------');
    console.log('    end of Testing the Item');
    console.log('------------------------------------\n');
};
Item.selfTest();


// A Player represents a name, description and other
// traits. A Player has a container of items.
var Player = Object.create(Item);
Player.init = function (name, description) {
    'user strict';
    Item.init();
    this.name = name;
    this.description = description;
    this.race = 'Orc';
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


var Room = Object.create(Container);
Room.init = function init(name, description) {
    'use strict';
    Container.init();
    this.name = name || '';
    this.description = description || 'A dull room';

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
            results.push(anExit + ': ' + self.exits[anExit]);
        }
    }
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
    // Provide inline testing of code.
    var inline = require('./lib/inlineTest.js');
    var itc = inline.inTestConfig();
    itc.zeroCounts();
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


