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
        this.type = 'Dict';
        this.elements = {};
        lcl_utils.debugLog('Init: Dict: ' + name);
    }
};

// true or false, is key in this?
Dict.has = function has(key) {
    return this.elements[key] ? true : false;
};

// If key is present, return the value.
// If key not present, return default value.
// If no default value in args, return undefined.
Dict.get = function get(key, defaultValue) {
    return this.elements[key] ? this.elements[key] : defaultValue;
};

// Set a key in Dic to val.
// Always answers val.
Dict.set = function set(key, val) {
    if(key === undefined) {
        throw 'Attempting to set() with key === undefined';
    }
    //lcl_utils.debugLog('\nDict.set: key:' + inspect(key));
    //lcl_utils.debugLog('Dict.set: val:' + inspect(val));
    // val gets returned.
    this.elements[key] = val;
    return val;
};

// Remove the key.
// Returns false only when property can not be deleted.
Dict.remove = function remove(key) {
    return delete this.elements[key];
};

// Answers iterator obj that contains keys for each
// element in the map object.
Dict.keys = function keys() {
    return Object.keys(this.elements);
};

// Answers array obj that contains values for each
// element in the map object.
Dict.values = function values() {
    var result = [];
    var self = this;
    Object.keys(this.elements).forEach(function(key, ndx) {
        return result.push(self.elements[key]);
    });
    return result;
};

Dict.selfTest = function () {
    // Provide inline testing of code.
    var inline = require('./lib/inlineTest.js');

    var itc = inline.inTestConfig();
    if(!inline.isSelfTesting(process.env.DICT_TESTING)) {
        return;
    }
    console.log('\n==================================');
    console.log('     Test the Dict for corner cases.');
    console.log('====================================');
    // Test the Dict for corner cases.
    // Very unlikely a name of '__proto__' gets used, but handle it!
    // __proto__ insists on a special case for Dict

    itc.zeroCounts();
    var adict = Object.create(Dict);
    adict.init('adict');
    console.log('\n------------------------------');
    console.log('    Testing the Dict object');
    console.log('------------------------------\n');

/****
    itc.checkEq('no proto, yet', {}, adict.get('__proto__'));
    itc.checkEq('default proto:9876', adict.get('__proto__', 9876));
    itc.checkEq('setting proto to 1234', undefined, adict.set('__proto__', 1234));
    itc.checkEq('found proto', 1234, adict.get('__proto__'));
    itc.checkEq('removing proto', undefined, adict.remove('__proto__'));
    itc.checkEq('ensure no proto', undefined, adict.get('__proto__'));

    itc.checkEq('insert __proto__ is OK', 'ok-proto', adict.set('__proto__', 'ok-proto'));
    itc.checkEq('check the has() for __proto__', true, adict.has('__proto__'));
    itc.checkEq('can retrieve __proto__', 'ok-proto', adict.get('__proto__'));
****/

    // Add some entries to the dict
    adict.set('key1', 'val1');
    adict.set('key2', 'val2');
    adict.set('key3', 'val3');

    var keys = adict.keys();
    var keyArray = keys.filter(function (item) {
        return item === 'key1';
    });
    itc.checkEq('test keys array for key1', 'key1', keyArray[0]);

    var values = adict.values();
    var valuesArray = values.filter(function(value) {
        return value === 'val2';
    });
    itc.checkEq('val2 present in values array', 'val2', valuesArray[0]);

    //console.log('keys:' + inspect(keys));
    itc.checkEq('key1 is in keys', true, 'key1' in adict.elements);
    itc.checkEq('key2 is in keys', true, adict.has('key2'));
    itc.checkEq('key3 is in keys', true, adict.has('key3'));
    itc.checkEq('length of keys is 3', 3, keys.length);

    itc.checkEq('"foobar" not in dict', false, adict.has('foobar'));

    // get specific keys
    itc.checkEq('get key1 value', 'val1', adict.get('key1'));
    
    // Check default setting.
    itc.checkEq('check default', 'qwerty', adict.get('bogus', 'qwerty'));
    itc.checkEq('default ignored for existing key', 'val1', adict.get('key1', 'qwerty'));

    // check has()
    itc.checkEq('key1 exists', true, adict.has('key1'));
    itc.checkEq('bogus does not exist', false, adict.has('bogus'));
   
    // check remove()
    itc.checkEq('key1 removed', true, adict.remove('key1'));
    itc.checkEq('key1 not present', false, adict.has('key1'));


    itc.reportResults();
    itc.zeroCounts();
    console.log('------------------------------------');
    console.log('    end of Testing the Dict object');
    console.log('------------------------------------\n');
};

// A dictionary of all objects
var AllObjects = Object.create(Dict);
AllObjects.init('AllObjects');


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
    this.type = 'Container';
    AllObjects.elements[name + '-' + this.type] = this;
    lcl_utils.debugLog('Init: Container: ' + name);
};

// Return a list of keys of this.dict.elements.
Container.keys = function () {
    return Object.keys(this.dict.elements);
};


// Print the contents.
Container.inventory = function inventory(roomName) {
    var name = roomName || '';
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
    console.log('Inventory of ' + this.name + ': ' + title);
    var self = this;
    keys.forEach(function (item) {
        var count = self.dict.elements[item].count;
        var name = self.dict.elements[item].name;
        console.log('\t' + count + ': ' + name);
    });
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
};

Container.get = function get(item) {
    var name = (typeof item === 'string') ? item : item.name;
    return this.dict.elements[name];
};

Container.set = function set(item) {
    if(item === undefined) {
        throw 'Cannot "set()" withundefined item';
    }
    if(item instanceof 'string') {
        throw 'Cannot store item by name, must use instance';
    }

    var name = (typeof item === 'string') ? item : item.name;
    return this.dict.elements[name] = item;
};

// Answer true if OK, false otherwise
Container.take = function take(item) {
    if(item === undefined) {
        return false;
    }

    var name = item.name;

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

    //var keys = Object.keys(this.dict.elements);
    //lcl_utils.debugLog('take: ' + item.name + ' thisContainer.keys:' + inspect(keys))
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
        this.dict.set(name, storedItem);
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
    // Provide inline testing of code.
    var inline = require('./lib/inlineTest.js');

    var itc = inline.inTestConfig();
    if(!inline.isSelfTesting(process.env.CONTAINER_TESTING)) {
        return;
    }
    console.log('\n==================================');
    console.log('     Test the Container.');
    console.log('====================================');

    itc.zeroCounts();

    var container = Object.create(Container);
    container.init('testContainer');

    console.log('container.keys:' + inspect(container.keys()));

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

    this.type = 'Item';
    AllObjects.elements[name + '-' + this.type] = this;
    lcl_utils.debugLog('Init: Item: ' + name);

};

Item.selfTest = function () {
    var inline = require('./lib/inlineTest.js');
    if(!inline.isSelfTesting('ITEM_TESTING')) {
        return;
    }
    console.log('\n==================================');
    console.log('     Test the Item.');
    console.log('====================================');

    var itc = inline.inTestConfig();
    itc.isTesting = true;
    itc.zeroCounts();

    var item = Object.create(Item);
    item.init('emptyItem');
    
    // Create some objects.
    var ax = Object.create(Item);
    ax.init('ax', 'an ordinary looking ax');

    var foo = Object.create(Item);
    foo.init('fooDefault'); // default name

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
    container.init('container');

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
    this.location = ''; // In what room is this player?
    this.elements = Object.create(Container);
    this.elements.init(name);
    this.type = 'Player';
    AllObjects.elements[name + '-' + this.type] = this;
    //
    // Shortened call sequences - Law of Demeter
    this.inventory = this.elements.inventory;
    this.inventoryList = this.elements.inventoryList;
    this.printInventory = this.elements.printInventory;
    this.isCarrying = this.elements.isCarrying;
    this.take = this.elements.take;
    this.drop = this.elements.drop;
    this.has = this.elements.has;
    this.get = this.elements.get;
    this.set = this.elements.set;
    this.dict = this.elements.dict;
    this.values = this.dict.values;
    this.keys = this.elements.keys;
    lcl_utils.debugLog('Init: Player: ' + name);
};

Player.selfTest = function playerSelfTest() {
    var inline = require('./lib/inlineTest.js');
    if(!inline.isSelfTesting('PLAYER_TESTING')) {
        return;
    }
    console.log('\n==================================');
    console.log('     Test the Player.');
    console.log('====================================');

    var itc = inline.inTestConfig();
    itc.isTesting = true;
    itc.zeroCounts();

    var player = Object.create(Player);
    player.init('player', 'an unassuming guy');

    var beer = Object.create(Item);
    beer.init('beer', ' a frothy one');
    beer.onlySingle = false;    // can take many

    var ret = player.take(beer);
    console.log('player take beer, ret:' + ret);
    itc.checkEq('took 1 beer', 1, player.get('beer').count);
    player.take(beer);
    itc.checkEq('took 2 beer', 2, player.get('beer').count);
    player.take(beer);
    ret = player.drop('beer');
    itc.checkEq('took 3 beer, dropped 1 => 2', 3, player.get('beer').count);
    ret = player.drop('beer');
    itc.checkEq('took 3 beer, dropped 2 => 1', 3, player.get('beer').count);
    ret = player.drop('beer');
    ret = player.isCarrying('beer');
    itc.checkEq('took 3 beer, dropped 3 => 0', false, ret);
};
Player.selfTest();


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
    //
    if(dir === undefined) {
        return undefined;
    }
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
                ' ' + this.name + ' has no exit ' + direction +
                ' to room ' + thisRoom.name);
        return false;
    }
    var newRoom = thisRoom.getExit(dir);
    if(newRoom === undefined) {
        say('Cannot exit this room ' + direction + 
                ' by ' + this.name);
        return false;
    }
    
    // OK to move the player
    thisRoom.drop(this);

    newRoom.take(this);

    
    //// BUG???
    assert(thisRoom.isCarrying(this.name) === false);
    assert(newRoom.isCarrying(this.name) === true);

    return true;
};


var Room = Object.create({});
Room.init = function init(name, description) {
    'use strict';
    this.name = name || '';
    this.description = description || 'A dull room';
    this.elements = Object.create(Container);
    this.elements.init(name);
    this.type = 'Room';
    AllObjects.elements[name + '-' + this.type] = this;

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
    this.take = this.elements.take;
    this.drop = this.elements.drop;
    this.has = this.elements.has;
    this.get = this.elements.get;
    this.set = this.elements.set;
    this.dict = this.elements.dict;
    this.keys = this.elements.keys;
    lcl_utils.debugLog('Init: Room ' + name);
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
    // (Might yield Escher style topology!?!?)
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
            ; // lcl_utils.debugLog(self.name + ' direction occupied:' + dir);
        } else {
            out[dir] = self.exits[dir];
        }}
    return out;
};

Room.printAllExits = function printAllExits(title) {
    var allExits = this.getAllExits();
    console.log(title + ' for ' + this.name + ':');
    //ro.reportObject(allExits, '', 2, 5);
    for(var dir in allExits) {
        var exitDir = allExits[dir];
        console.log('\t' + dir + ': ' + exitDir.name);
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
        console.log('\n==== testMovePlayer ========');
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
        console.log('reportObject on bedroom');
        ro.reportObject(bedroom, '', 1, 7);
        console.log('reportObject on bedroom.elements.dict');
        ro.reportObject(bedroom.elements.dict, '', 1, 7);
        console.log('reportObject on player');
        ro.reportObject(player, '', 1, 7);
        console.log('reportObject defaults on player');
        ro.reportObject(player);

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
        beer.init('bedroomBeer');
        var gold = Object.create(Item);
        gold.init('bedroomGold');
        bedroom.take(beer);
        bedroom.take(gold);
        bedroom.inventory('bedroom after taking gold and beer');
       
        // Add some items to the bath
        var vase = Object.create(Item);
        vase.init('bathVase');
        var soap = Object.create(Item);
        soap.init('bathSoap');
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

        bedroom.printInventory('bedroom inventory');

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

    itc.checkEq('test lcl_utils.notExists()', true, lcl_utils.notExists(undefined));
    try {
        lcl_utils.repeatString('abc', -1);
    } catch (err) {
        console.log('caught negative repeatString:' + err);
    } finally {
        console.log('in finally with negative repeat string');
    }

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

/***
Dict.selfTest();
Container.selfTest();
Item.selfTest();
Room.selfTest();
***/

//lcl_utils.debugLog('\n==== All Objects ===');
//lcl_utils.debugLog(inspect(AllObjects));


module.exports.Dict = Dict;
module.exports.Item = Item;
module.exports.Player = Player;
module.exports.Container = Container;
module.exports.Room = Room;
module.exports.say = say;
module.exports.blank = blank;
module.exports.normalizeDirection = normalizeDirection;
module.exports.AllObjects = AllObjects;

