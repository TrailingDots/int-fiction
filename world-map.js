//
// How the world get laid out - in pieces and connectivity.
//
var nw = require('./new-world');
var inspect = require('util').inspect;

var player = Object.create(nw.Player);
player.init('Frobitz', 'A goofy looking guy.');
console.log('player:' + inspect(player));
player.race = 'hobbit';
player.canCarry = true;

var ax = Object.create(nw.Item);
ax.init('ax', 'A fearsome rusty ax');
player.take(ax);

var watch = Object.create(nw.Item);
watch.init('watch', 'An old rusty but reliable watch');
player.take(watch);

var scarf = Object.create(nw.Item);
scarf.init('scarf', 'A red bandana-like scarf.');
player.take(scarf);

var bedroom = Object.create(nw.Room);
bedroom.init('bedroom');
bedroom.description = 'A dull bedroom with little chance for nookie';

var bed = Object.create(nw.Item);
bed.init('bed');
bed.description = 'Miserable looking dirty bed.';

var lamp = Object.create(nw.Item);
lamp.init('lamp');
lamp.description= 'Weird hippie lamp';

var kitchen = Object.create(nw.Room);
kitchen.init('kitchen', 'A messy kitch with dirty dishes everywhere');

var table = Object.create(nw.Item);
table.init('table', 'A plain looking, old table.');
table.canCarry = false;

var garage = Object.create(nw.Room);
garage.init('garage', 'A garage with tools all over');

var livingRoom = Object.create(nw.Room);
livingRoom.init('livingRoom', 'mess living room. Trash everywhere');

var beer = Object.create(nw.Item);
beer.init('beer', 'A can of cheap, flat beer.');
beer.onlySingle = false;
kitchen.take(beer);
kitchen.take(beer);
kitchen.take(beer); // take a few cans of cheap beer.

var whiskey = Object.create(nw.Item);
whiskey.init('whiskey', 'Cheap looking bottle of booze');
kitchen.take(whiskey);

// Put the player into the bedroom
bedroom.take(player);
player.location = bedroom;
bedroom.take(bed);
bedroom.take(lamp);

// Connect the bedroom to the kitchen and living room.
bedroom.addExit('n', kitchen);
kitchen.addExit('s', bedroom);

bedroom.addExit('e', livingRoom);
livingRoom.addExit('w', bedroom);

livingRoom.addExit('e', garage);
garage.addExit('w', livingRoom);

// Where to start - the player is here.
var startingRoom = bedroom;

module.exports.startingRoom = startingRoom;
module.exports.player = player;
