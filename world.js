

require("babel-register");   // xform by Babel all *.js
var assert = require('assert');
var inspect = require('util').inspect;
var R = require('ramda');

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
Dict.prototype.remove = function remove(key) {
    if(key === "__proto__") {
        this.hasSpecialProto = false;
        this.specialProto = undefined;
    } else {
        delete this.elements[key];
    }
};


function Player(name) {
    'use strict';
    var self = this instanceof Player ? this : new Player(name);
    self.name = name || 'Frobitz';  // default name of player
    self.description = 'You do not see anything special.';
    self.location = '';
    self.inventory = Dict();

    /**
     * Given an item and a player, determine if that item is in
     * the player's inventory.
     *
     * @param item as cloned from the inventory.
     * @return undefined if item not in player inventory
     * @return cloned item if item is in player inventory.
     */
    self.isCarrying = function isCarrying(item) {
        return self.inventory.get(item.name);
    };

    // Add an item to inventory
    // Answer true if OK, false otherwise
    self.take = function take(item) {
        if(!item.isMovable) {
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
            self.inventory.set(clonedItem.name, clonedItem);
        }
        return true;
    };
    return self;
}


function Item(name) {
    'use strict';
    var self = this instanceof Item ? this : new Item(name);
    self.name = name || '';
    self.description = 'You do not see anything special about ' + self.name;
    self.isMovable = true;

    // true if singles only like beer. Gold is multiple.
    // When dropping/deleting this item, the count gets set to 0.
    self.isSingle = true; 
    self.count = 0;

    self.weight = 1;
    self.close_description = 'You do not see anything special.';
    return self;
}

function Container (name) {
    'use strict';
    var self = this instanceof Container ? this : new Container(name);
    self.name = name || '';
    self.transparent = false;
    self.status = 'closed';

    // Contents of the room
    self.inventory = Object.create(null); // null object

    return self;
}

function Room(name) {
    'use strict';
    var self = this instanceof Room ? this : new Room(name);
    self.name = name || '';
    self.long_description = '';
    self.objects = {};

    // contents of the room
    self.inventory = Object.create(null); // null object

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


function inventory(player) {
    'use strict';
    say('Inventory:');
    for (var name in player.inventory.elements) {
        say('    ' + name);
    }
    return true;
}


// NOT DONE - TODO FIXME
function drop(item, player) {
    // Return true if item dropped,
    // false if the player is not carrying the item.
    if( !player.inventory.has(item.name) ) {
        say(player.name + ' is not carrying ' + item.name);
        return false;
    }
    player.inventory.remove(item.name);
}

// See http://ryanmorr.com/true-hash-maps-in-javascript/
// No prototypes in the generics map.
var generics = Object.create(null);
generics.describe = Room;
generics.examine = Item;
generics.go = direction;
generics.connect = [Room, Room];  // Connect two rooms
generics.exits = Room;
generics.inventory = Player;
generics.drop = drop;
generics.carrying = [Item, Player];


module.exports.Player = Player;
module.exports.Item = Item;
module.exports.Container = Container;
module.exports.Room = Room;
module.exports.say = say;
module.exports.blank = blank;
module.exports.generics = generics;
module.exports.drop = drop;
module.exports.inventory = inventory;
module.exports.direction = direction;

// Below this the code gets used to provide
// a debugging platform because mocha does
// not allow an easy debugging environment.
// Code gets debugged from below here
// and moved to mocha testing. The code
// remains because further development
// can break existing tests.
(function simpleMain() {
    var player = Player('xyzzy');
    var lantern = Item('lantern');
    var whiskey = Item('Whiskey');
    var ret = player.take(lantern);
    console.log('ret=' + ret + ' player takes lantern');
    var carrying = player.isCarrying(whiskey);
    if(!carrying) {
        console.log('As expected, xyzzy is not carrying whiskey');
    } else {
        console.log('ERROR: xyzzy should not be carrying whiskey');
    }
    console.log('attempt to carry another lantern.');
    ret = player.take(lantern);
    if(ret) {
        console.log('As expected, xyzzy cannot take 2 lanterns.');
    } else {
        console.log('ERROR: xyzzy took a second lantern.');
    }
})();

var adict = Dict({
    alice: 34,
    bob: 24,
    chris: 62
});

// Necessary vars for easy debugging.
var player = Player('xyzzy');
var ax = Item('ax');
var table = Item('table');
table.isMovable = false;
var door = Item('door');
door.isMovable = false;
var beer = Item('beer');
beer.isSingle = false;  // Many bottles of beer OK
var gold = Item('gold');
gold.isSingle = false;  // lots of gold OK
player.take(ax);
player.take(ax);    // only one ax allowed
player.take(beer);
player.take(beer);  // mulitple beer allowed
player.take(table); // does not happen.


