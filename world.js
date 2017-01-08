//
// Interactive fiction project
require("babel-register");   // xform by Babel all *.js
var assert = require('assert');
var inspect = require('util').inspect;
var R = require('ramda');
var util = require('util');

// Provide inline testing of code.
var inline = require('./lib/inlineTest.js');
var itc = inline.inTestConfig;
itc.isTesting = true;   // start inline testing.


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


function Container (name) {
    'use strict';
    var self = this instanceof Container ? this : new Container(name);
    self.name = name || '';
    self.status = 'closed';

    // Contents of the room
    self.contents = Dict();

    /**
     * Given an item, determine if that item is in
     * the contents.
     *
     * @param item as cloned from the contents.
     * @return undefined if item not in player contents
     * @return cloned item if item is in player contents.
     */
    self.isCarrying = function isCarrying(item) {
        return self.contents.get(item.name);
    };

    self.get = function get(item) {
        return self.contents.get(item.name);
    };

    self.getByName = function getByName(name) {
        return self.contents.get(name);
    };

    /*** Needed?
    self.set = function set(item) {
        self.contents.set(item.name, item);
    };
    ***/
    
    // Answer true if OK, false otherwise
    self.take = function take(item) {
        if(item.isSingle) {
            say("This item cannot be moved.");
            return false;
        } 
        var carryItem = self.isCarrying(item);

        if(carryItem) {
            // Already have this item, ensure multiples OK
            if(carryItem.isSingle) {
                say('This item is already with the player');
                return false;   
            }
            carryItem.count += 1;
        } else {
            // Save a clone and NOT the item reference!
            var clonedItem = R.clone(item);
            clonedItem.count += 1;
            console.log('cloned saved, count:' + clonedItem.count);
            self.contents.set(clonedItem.name, clonedItem);
        }
        return true;
    };

    // Drop an item.
    // Return the item with decremented ount if multiple instances.
    // If the item was dropped, return true.
    // If the player does not have the item, return false. 
    self.drop = function drop(item) {
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
    self.inventory = function inventory() {
        say('Inventory:');
        for (var name in this.contents.elements) {
            if(this.contents.elements.hasOwnProperty(name)) {
                say('    ' + name);
            }
        }
        return true;
    };

    // Return the individual items as an array.
    self.inventoryList = function inventoryList() {
        var items = [];
        for (var name in this.contents.elements) {
            if(this.contents.elements.hasOwnProperty(name)) {
                items.push(this.contents.elements[name]);
            }
        }
        return items;
    };

    return self;
}

function Player(name) {
    'use strict';
    var self = this instanceof Player ? this : new Player(name);
    self.name = name || 'Frobitz';  // default name of player
    self.description = 'You do not see anything special.';
    self.location = '';
    self.contents = Container(self.name);

    /**
     * Given an item, determine if that item is in
     * the contents.
     *
     * @param item as cloned from the contents.
     * @return undefined if item not in player contents
     * @return cloned item if item is in player contents.
     */
    self.isCarrying = function isCarrying(item) {
        return self.contents.isCarrying(item);
    };

    // Return an item in storage
    self.get = function get(item) {
        return self.contents.get(item);
    };

    // Return an item by name.
    self.getByName = function getByName(name) {
        return self.contents.getByName(name);
    };

    // Answer true if OK, false otherwise
    self.take = function take(item) {
        return self.contents.take(item);
    };

    // Drop an item.
    self.drop = function drop(item) {
        return self.contents.drop(item);
    };


    // Print the contents
    self.inventory = function inventory() {
        return self.contents.inventory();
    };

    // Return just the individual items of contents as an array.
    self.inventoryList = function inventoryList() {
        return self.contents.inventoryList();
    };

    return self;
}


function Item(name) {
    'use strict';
    var self = this instanceof Item ? this : new Item(name);
    self.name = name || '';
    self.description = 'You do not see anything special about ' + self.name;
    self.isSingle = true;

    // true if singles only like beer. Gold is multiple.
    // When dropping/deleting this item, the count gets set to 0.
    self.isSingle = true; 
    self.count = 0;

    /*** Needed?
    self.getCount = function getCount() {
        return self.count;
    };
    ***/

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

    // contents of the room
    self.contents = Container(self.name);

    return self;
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
    var player = Player('xyzzy');
    var lantern = Item('lantern');
    var whiskey = Item('whiskey');
    whiskey.isSingle = false;
    var ax = Item('ax');
    player.take(ax);
    var ret = player.take(lantern);
    itc.exists('Empty obj exists', {});
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

    var newWhiskey = player.get(whiskey);
    itc.checkEq('container get()', 'whiskey', newWhiskey.name);

    var ret = player.drop(whiskey);
    itc.checkEq('can drop 1 whiskey', true, ret);

    // Test the Dict for corner cases.
    // Very unlikely a name of '__proto__' gets used, but handle it!
    // __proto__ insists on a special case for Dict
    var adict = Dict();
    itc.checkEq('no proto, yet', undefined, adict.get('__proto__'));
    itc.checkEq('default proto:9876', adict.get('__proto__', 9876));
    itc.checkEq('setting proto to 1234', undefined, adict.set('__proto__', 1234));
    itc.checkEq('found proto', 1234, adict.get('__proto__'));
    itc.checkEq('removing proto', undefined, adict.remove('__proto__'));
    itc.checkEq('ensure no proto', undefined, adict.get('__proto__'));


    itc.reportResults();

    itc.zeroCounts();   // Clear counts for coverage report.
    itc.usage();        // Report for coverage.
    inline.selfTest();         // Call self-tester for coverage report.
}
simpleMain();

var adict = Dict({
    alice: 34,
    bob: 24,
    chris: 62
});


/****
// Necessary vars for easy debugging.
var player = Player('xyzzy');
var ax = Item('ax');
var table = Item('table');
table.isSingle = true;
var door = Item('door');
door.isSingle = true;
var beer = Item('beer');
beer.isSingle = false;  // Many bottles of beer OK
var gold = Item('gold');
gold.isSingle = false;  // lots of gold OK
player.take(ax);
player.take(ax);    // only one ax allowed
player.take(beer);
player.take(beer);  // mulitple beer allowed
player.take(table); // does not happen.
***/


