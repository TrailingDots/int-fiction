//
// Interactive fiction project
// To get all functions:   egrep "^fun|^[A-Z]" world.js
//
require("babel-register");   // xform by Babel all *.js
var assert = require('assert');
var inspect = require('util').inspect;
var R = require('ramda');
var util = require('util');
var ro = require('./lib/reportObject');
var lcl_utils = require('./lib/lcl_utils');

// Misc utility fcns
function say(things) {
    'use strict';
    console.log(things);
}

function blank() {
    'use strict';
    console.log('\n');
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
var DictInitCount = 0;
var Dict = {
    init: function init(name) {
        DictInitCount += 1;
        this.name = name || 'aDict';
        this.elements = {};
    }
};
Dict.has = function has(key) {
    return this.elements.has(key);
};

// If key is present, return the value.
// If key not present, return default value.
// If no default value in args, return undefined.
Dict.get = function get(key, defaultValue) {
    return this.elements.get(key) ? this.elements.get(key) : defaultValue;
};
// Set a key in Dic to val.
// Always answers val.
Dict.set = function set(key, val) {
    // val get returned.
    return this.elements.set(key, val);
};

// Remove the key.
// Answers undefined even if key is not present. Standard JS!
// Answers the item if the key/value exists.
Dict.remove = function remove(key) {
    return this.elements.delete(key);
};

// Answers iterator obj that contains keys for each
// element in the map object.
Dict.keys = function keys() {
    return Object.keys(this.elements);
};

// Answers iterator obj that contains values for each
// element in the map object.
Dict.values = function values() {
    return this.elements.values();
};

Dict.entries = function entries() {
    return this.elements.entries();
}

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


// Answers with a new instance of Container.
// Most parts of the game have a Container of some sort.
// The contents of a Container has only Item instances.
// A table can have candles, gold and food. 
//var Container = Object.create(Dict);
var Container = Object.create({});
Container.init = function (name) {
    this.name = name || 'xyzzy';
    this.dict = Object.create(Dict);
    this.dict.init(this.name);
};

// Return a list of keys of this.dict.elements.
Container.keys = function () {
    var alist = [];
    Object.keys(this.dict.elements).forEach(function (element) {
        alist.push(element);
    });
    return alist;
}


// Print the contents.
Container.inventory = function inventory(roomName) {
    name = roomName || '';
    process.stdout.write(name + ' Inventory:[');
    var self = this;
    Object.keys(self.dict.elements).forEach(function(elt, key) {
        if(self.dict.elements.hasOwnProperty(elt)) {
            process.stdout.write(', ' + elt);
        }
    });
    process.stdout.write(']\n');
    return true;
};

// Return the individual items as a list.
// No specific order of items exist.
Container.inventoryList = function inventoryList() {
    var items = [];
    for (var name in this.dict.elements) {
        if(this.dict.elements.hasOwnProperty(name)) {
            items.push(this.dict.elements[name]);
        }
    }
    return items;
};

Container.printInventory = function (title) {
    var keys = Object.keys(this.dict.elements);
    var keyStr = inspect(keys);
    process.stdout.write('    Inventory of ' + this.name + ': ' + title);
    process.stdout.write('\t' + keyStr + '\n');
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
    return this.dict.elements[name] ? true : false;
};

Container.has = function (item) {
    return this.isCarrying(item);
}

Container.get = function get(item) {
    var name = (typeof item === 'string') ? item : item.name;
    return this.dict.elements[name];
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
        currItem = this.dict.elements[name];
        if(currItem.onlySingle) {
            say(name + ' is already in the container');
            return false;   
        }
    } else {
        currItem = item;
    }
    /***
    // Save a clone and NOT the item reference!
    // If the item exists, inc in the Dict to prevent
    // shadows. See p. 90, This & Object Prototypes
    var clonedItem = R.clone(currItem);
    ***/
    currItem.count += 1;
    if(isNaN(currItem.count)) {
        console.log('got count === NaN   WTF!');
    }
    this.dict.elements[currItem.name] = currItem;

    var keys = Object.keys(this.dict.elements);
    //console.log('take: ' + item.name + ' thisContainer.keys:' + inspect(keys))
    return true;
};

// Drop an item.
// Return the item with decremented count if multiple instances.
// If the item was dropped, return true.
// If the player does not have the item, return false. 
// TODO: Need a routine to drop the item if the count > 0, such as beer.
Container.drop = function drop(item) {
    if (item === undefined) {
        return false;
    }
    var name = (typeof item === 'string') ? item : item.name;
    var isStored = this.isCarrying(name);
    if (!isStored) {
        if (item) {
            say(name + ' is not present.');
        } else {
            say('"undefined item" is not present.');
        }

        return false;
    }

    var storedItem = this.dict.elements[name];
    if (storedItem.count > 0) {
        storedItem.count -= 1;
    }

    if (storedItem.count <= 0) {
        delete this.dict.elements[name];
        assert( ! this.has(storedItem.name));
    }

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
/**
    var ret = container['key1'] = 'val1';
    ret = container['key2'] = 'val2';
    ret = container['key3'] = 'val3';
    itc.checkEq('set key1 to val1', 'val1', (container['key1'] = 'val1'), 'val1');
    itc.checkEq('get key1', 'val1', container['key1'], 'val1');
    var aList = container.inventoryList();
    container.inventory('key 1 2 3 test');
***/
    itc.reportResults();
    itc.zeroCounts();
    console.log('------------------------------------');
    console.log('    end of Container selfTest');
    console.log('------------------------------------\n');
};

// An Item gets placed into the contents of something.
// E.g.: A candle onto a table, gold into a Player's pocket.
// The contents dict contains instances of Item. Each Item
// has a name.
var Item = Object.create(null);
Item.init = function init(name, description) {
    'use strict';
    this.name = name || '';
    this.description = description || ('You do not see anything special about ' + this.name);

    // Many items can be carried. 
    // Some, like tables, cannot be carried.
    this.canCarry = true;

    // false if multiples OK like beer or gold.
    // When dropping/deleting this item, the count gets 
    // decremented. When the count reaches 0, the item
    // disappears.
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
    // Needed?  itc.checkEq('orig gold has 0 count', 0, gold.count);

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


// A Player represents a name, description and other
// traits. A Player has a container of items.
var Player = Object.create({});
Player.init = function (name, description) {
    'user strict';
    this.name = name || 'Frobitz';
    this.description = description || '';
    this.count = 0; // To ease inventory listing.
    this.race = 'Orc';
    this.elements = Object.create(Container);
    this.elements.init('Player-' + name);
    //
    // Shortened call sequences - Law of Demeter
    this.inventory = this.elements.inventory;
    this.inventoryList = this.elements.inventoryList;
    this.printInventory = this.elements.printInventory;
    this.isCarrying = this.elements.isCarrying;
    this.entries = this.elements.entries;
    this.values = this.elements.values;
    this.take = this.elements.take;
    this.drop = this.elements.drop;
    this.has = this.elements.has;
    this.get = this.elements.get;
    this.set = this.elements.set;
    this.dict = this.elements.dict;
    this.keys = this.elements.keys;
};

// Return a "standard" direction name.
// A "standard" is the abbreviated from of a direction.
// undefined results from an unknown direction.
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

// Given a room and a player, move the player a 
// desired direction - if possible.
// Returns true if transition performed.
// Returns false if no transition in the desired 
// direction possible.
// @param thisRoom = The room the player currently resides in.
// @param direction = The exit the player will take. The value
//      in this direction contains the room the player moves to.
// NOTE: The "to" room creates a 1-way tunnel.
// The caller must setup proper exits for each room.
Player.movePlayer = function movePlayer(thisRoom, direction) {
    var dir = normalizeDirection(direction);
    if(dir === undefined) {
        say('Unknown direction: ' + direction + 
                ' ' + player.name + ' cannot move ' + direction +
                ' to room ' + thisRoom.name);
        return false;
    }
    var newRoom = thisRoom.getExit(dir);
    if(newRoom === undefined) {
        say('Cannot exit this room ' + direction + 
                ' by ' + player.name);
        return false;
    }
    /***
    console.log('Moving ' + this.name + 
            ' from ' + thisRoom.name +
            ' to ' + newRoom.name);
    console.log('=========================== start of move drop/take ====');
    thisRoom.printInventory('thisRoom before drop/take');
    newRoom.printInventory('newRoom before drop/take');
    ***/
    
    // OK to move the player
    thisRoom.drop(this);

    //thisRoom.printInventory('after dropping player from ' + thisRoom.name);

    newRoom.take(this);

    /***
    newRoom.printInventory('newRoom after a take player from ' + newRoom.name);
    thisRoom.printInventory('thisRoom after a take  player from ' + thisRoom.name);

    thisRoom.printInventory(thisRoom.name + ' after drop/take');
    newRoom.printInventory(newRoom.name + ' after drop/take');

    console.log('=========================== end of move drop/take ====');
    ***/
    
    //// BUG
    assert(thisRoom.isCarrying(this.name) == false);
    assert(newRoom.isCarrying(this.name) == true);
};


var Room = Object.create({});
Room.init = function init(name, description) {
    'use strict';
    this.name = name || '';
    this.description = description || 'A dull room';
    this.elements = Object.create(Container);
    this.elements.init('Room-' + name);

    // Map of exits. 
    // Key: the direction.
    // Value: the room name for that direction.
    this.exits = {};   //Object.create(Dict);
    //
    // Shortened call sequences - Law of Demeter
    this.inventory = this.elements.inventory;
    this.inventoryList = this.elements.inventoryList;
    this.printInventory = this.elements.printInventory;
    this.isCarrying = this.elements.isCarrying;
    this.entries = this.elements.entries;
    this.values = this.elements.values;
    this.take = this.elements.take;
    this.drop = this.elements.drop;
    this.has = this.elements.has;
    this.get = this.elements.get;
    this.set = this.elements.set;
    this.dict = this.elements.dict;
    this.keys = this.elements.keys;
};

Room.exitStrings = function exitStrings() {
    var results= [];
    var self = this;    // Better: See: Effective JS, p. 100.
    for(var anExit in this.exits) {
        if(this.exits.hasOwnProperty(anExit)) {
            results.push(anExit + ': ' + self.exits[anExit]);
        }
    }
    return results;
};


// Add an exit to a room.
// Answer true if added.
// Answer false if room already used.
Room.addExit = function addExit(dir, room) {
    var normDir = normalizeDirection(dir);
    if(normDir === undefined) {
        say(normDir + ' is not a valid direction');
        return undefined;
    }
    var item = this.exits[normDir];
    if(item !== undefined) {
        // Th!s direction already used.
        say(normDir + ' is already in use  for ' + this.name);
        return false;
    }
    /****
    // Cannot add an exit to the room itself
    // (Might yield Escher style topology!
    // Safe to add item
    if(room.name === this.name) {
        say(room.name + ' cannot connect to itself.');
        return false;
    }
    ****/

    this.exits[normDir] = room;
    return true;
};

// Answer the value of a specific exit in a room.
Room.getExit = function getExit(dir) {
    var normDir = normalizeDirection(dir);
    if(normDir === undefined) {
        //say(normDir + ' is not a valid direction');
        return undefined;
    }
    var item = this.exits[normDir];
    if(item === undefined) {
        say(this.name + ' no exit ' + dir);
        return undefined;
    }
    return item;
};

// Given a room, return a dictionary with all
// directions with key as direction, value = new room
Room.getAllExits = function getAllExits() {
    var out = {};
    var self = this;
    var dirs = ['n', 'e', 's', 'w'];
    for(var ndx in dirs) {
        var dir = dirs[ndx];
        if(self.exits[dir] === undefined) {
            console.log(self.name + ' direction occupied:' + dir);
        } else {
            out[dir] = self.exits[dir];
        }}
    return out;
};

Room.printAllExits = function printAllExits(title) {
    var allExits = this.getAllExits();
    console.log(title + ' For room ' + this.name + ': all exits:');
    //ro.reportObject(allExits, '', 2, 5);
    for(var dir in allExits) {
        var exitDir = allExits[dir];
        var exitName = exitDir ? exitDir.name : 'unused-exit';
        console.log('\t' + dir + ': ' + exitName);
    }
};

Room.selfTest = function () {
    // Provide inline testing of code.
    var inline = require('./lib/inlineTest.js');
    if(!inline.isSelfTesting('ROOM_TESTING')) {
        return;
    }
    var itc = inline.inTestConfig();
    itc.zeroCounts();
    itc.isTesting = true;
    itc.zeroCounts();   // Clear counts for coverage report.

    function testMovePlayer() {
        console.log('\n==== testMovePlayer ========')
        console.log('====== Testing moving players between rooms');
        console.log('DictInitCount:' + DictInitCount);

        var bedroom = Object.create(Room);
        bedroom.init('bedroom');
        var bath = Object.create(Room);
        bath.init('bath');

        // A player to be moved between rooms
        var player = Object.create(Player);
        player.init('Dudley');
        player.canCarry = true;

        // Put the player in the bedroom
        ro.reportObject(bedroom.elements, '', 2, 5);
        bedroom.inventory('in bedroom before adding Dudley');
        bedroom.elements.inventory('in bedroom before adding Dudley');
        var ret = bedroom.take(player);
        ret = bedroom.isCarrying(player);
        if(ret) {
            console.log('bedroom has player in it');
        } else {
            console.log('ERROR: bedroom does NOT have player in it');
        }
        bedroom.inventory('bedroom after adding Dudley');
        bedroom.drop(player);   // Drop DudLey
        bedroom.inventory('bedroom after dropping Dudley');
        bedroom.take(player);
        bedroom.inventory('bedroom after taking Dudley again');

        // Add a few more items to the bedroom
        var beer = Object.create(Item);
        beer.init('bedroom-beer');
        var gold = Object.create(Item);
        gold.init('bedroom-gold');
        bedroom.take(beer);
        bedroom.take(gold);
        bedroom.inventory('bedroom after taking gold and beer');
       
        // Add some items to the bath
        var vase = Object.create(Item);
        vase.init('bath-vase');
        var soap = Object.create(Item);
        soap.init('bath-soap');
        bath.take(vase);
        bath.take(soap);
        bedroom.inventory('bath after taking vase and soap');

        // move player
        // Go north to the bath
        bedroom.addExit('n', bath);
        ret = bedroom.getExit('n');
        itc.checkEq('n exit for bedroom should exist', 'bath', ret.name);
        bedroom.inventory('in bedroom before movePlayer');
        bath.inventory('in bath before movePlayer');
        player.movePlayer(bedroom, 'n'); // move player north from bedroom
        bedroom.printInventory('after movePlayer');
        bath.printInventory('after movePlayer');

        // player not in bedroom
        ret = bedroom.isCarrying(player);
        itc.checkEq('player should not be in bedroom (false)', false,  ret);

        // player in the bath
        ret = bath.isCarrying(player);
        itc.checkEq('player should be in bath (true)', true, ret);

        bath.printInventory('bath Inventory');

        bedroom.printInventory('bedroom inventory')

        bath.inventory('bath - should have player');
        bedroom.inventory('bedroom - should be empty');

        console.log('DictInitCount:' + DictInitCount);
    }

    console.log('\n------------------------------');
    console.log('    Testing the Room object');
    console.log('------------------------------\n');

    var ret;  // General catchall for return status

    testMovePlayer();

    var room = Object.create(Room);
    room.init('closet');
    room.printAllExits('initial closet, no exits\n');

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

    var table = Object.create(Item);
    table.init('aTable');
    ret = room.take(table);
    ret = room.drop(table);
    ret = room.isCarrying('table');
    itc.checkEq('room dropped single table', false, ret);

    room.printAllExits('orig closet, no exits\n');

    ret = room.addExit('w', kitchen);
    room.printAllExits('Only w kitchen should exist\n');
    ret = room.addExit('w', kitchen);
    room.printAllExits('Again: Only w kitchen should exist. Cannot add 2 kitchens\n');

    itc.checkEq('Adding w kitchen', false, room.addExit('w', kitchen));
    room.printAllExits('Once again - only one kitchen.');
    itc.checkEq('w kitchen is in use already', false, room.addExit('w', garage));
    room.printAllExits('Repeat attempt to add w kitchen');
    itc.checkEq('Adding s bedroom', true, room.addExit('s', bedroom));
    itc.checkEq('Adding n garden', true, room.addExit('n', garden));
    itc.checkEq('w dir still used', false, room.addExit('w', pool));

    room.printAllExits('w should be in use, e is free\n');
    itc.checkEq('w still used', false, room.addExit('w', garage));
    itc.checkEq('e lies the garage', true, room.addExit('e', garage));

    room.printAllExits('All exits used: s=bedroom,n=garden,w=kitchen,e=garage\n');
    var roomName = room.getExit('w').name;
    itc.checkEq('w room must be kitchen', 'kitchen', roomName);
    itc.checkEq('bogus room must be undefined', undefined, room.getExit('bogus'));
    var exStr = room.exitStrings();
    console.log("Room exitStrings:" + exStr);

    var room1 = Object.create(Room);
    room1.init('pool');
    itc.checkEq('unknown direction results in undefined', undefined, room1.getExit('n'));
    itc.checkEq('attempt to add bogus exit fails', undefined, room1.addExit('bogus', 'nowhere'));

    // Test for all "byName" fcns
    var beer = Object.create(Item);
    beer.init('beer');
    beer.onlySingle = false;
    var gold = Object.create(Item);
    gold.init('gold');
    gold.onlySingle = false;

    var player = Object.create(Player);
    player.init('aName');
    ret = player.take(beer);
    itc.checkEq('taking beer should be ok', true, ret);
    ret = player.take(beer);
    itc.checkEq('take another beer', true, ret);

    itc.checkEq('byName takes gold', true, player.take(gold));
    var beerCarrier = player.isCarrying('beer');
    console.log('beerCarrier:' + inspect(beerCarrier));
    itc.checkEq('isCarrying beer', true, player.isCarrying('beer'));
    itc.checkEq('isCarrying foobar', false, player.isCarrying('foobar'));

    ret = player.get('beer');
    itc.checkEq('player.isCarrying beer', true, player.isCarrying('beer'));
    ret = player.get('beer').count;
    itc.checkEq('beer count must be 2', 2, player.get('beer').count);


    itc.reportResults();
    itc.zeroCounts();   // Clear counts for coverage report.
    console.log('------------------------------------');
    console.log('    end of Testing the Room object');
    console.log('------------------------------------\n');
};

console.log('typeof Dict:' + typeof(Dict));
console.log('typeof Item:' + typeof(Item));
console.log('typeof Player:' + typeof(Player));
console.log('typeof Room:' + typeof(Room));
console.log('typeof Container:' + typeof(Container));

Dict.selfTest();
Container.selfTest();
Item.selfTest();
Room.selfTest();


module.exports.Dict = Dict;
module.exports.Item = Item;
module.exports.Player = Player;
module.exports.Container = Container;
module.exports.Room = Room;
module.exports.say = say;
module.exports.blank = blank;

