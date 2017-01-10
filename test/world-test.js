//
require("babel-register");

var world = require("../world.js");

var assert = require ("assert");
var inspect = require('util').inspect;

describe('Testing the Player object', function () {
    describe('adding to contents', function () {

        it('should have only the items taken', function() {
            var player = world.Player();
            var lantern = world.Item('brass lantern');
            lantern.description = 'A nice brass lantern';
            var whiskey = world.Item('whiskey');
            whiskey.description = 'Rot gut whiskey';

            player.inventory();

            assert.equal(true, player.take(lantern));
            assert.equal(true, player.take(whiskey));

            //TODO: assert.equal(2, player.contents.length);
            assert.equal(lantern.name, 
                player.isCarrying(lantern).name);
            assert.equal(whiskey.name, 
                player.isCarrying(whiskey).name);


            // Cannot take immovable objects.
            var table = world.Item();
            table.isMovable = false;
            assert.equal(false, player.take(table));
        });

        it('should track what a player is carrying', function () {
            var player = world.Player('xyzzy');
            var lantern = world.Item('brass lantern');
            lantern.description = 'A nice brass lantern';
            var whiskey = world.Item('whiskey');
            whiskey.description = 'Rot gut whiskey';

            player.take(lantern);
            assert.equal(lantern.name, 
                player.isCarrying(lantern).name);
            assert.equal(undefined, player.isCarrying(whiskey));

            // A player can carry only one of an item.
            assert.equal(false, player.take(lantern));
        });

        it('should not take more than 1 item of the same kind', function() {
            var player = world.Player('abc');
            var lantern = world.Item('lantern');

            // take 1st lantern, OK
            assert.equal(true, player.take(lantern));
            // Cannot take 2nd lantern
            assert.equal(false, player.take(lantern));
        });

        it('should allow all objects to be created', function() {
            var container = world.Container('barrel');
            var container_noname = world.Container();
            var room = world.Room('kitchen');
            var room_noname = world.Room();
            var player = world.Player('xyzzy');
            var player_noname = world.Player();
            world.direction();
            world.say('This is the say fcn');
            world.blank();
            world.say('This is the say after a blank line.');
        });

    });

    describe('Player interactions', function() {
        it('should accept either a name or it defaults', function() {
            var player1 = world.Player();   // default name
            assert.equal('Frobitz', player1.name);
            var player2 = world.Player('Foobar'); // supplied name
            assert.equal('Foobar', player2.name);
        });

        it('should take only moveable items', function() {
            var player = world.Player();

            var beer = world.Item('beer');
            beer.isUnique = false;   // Can carry many bottle of beer
            var ret = player.take(beer);
            assert.equal(true, ret);

            var table = world.Item('table');
            table.isMovable = false;  // Cannot be carried at all.
            ret = player.take(table);
            assert.equal(false, ret); // Canot take table
        });

        it('should take mulitple instances only if not unique', function() {
            var player = world.Player();

            var gold = world.Item('gold');
            gold.isUnique = false; // Allow multiple gold

            var ax = world.Item('ax');
            ax.isUnique = true;     // true is the default.
            var ret = player.take(ax);
            assert.equal(true, ret);
            // Cannot take another ax
            ret = player.take(ax);
            assert.equal(false, ret);
            // Verify only one ax
            assert.equal(1, player.getByName('ax').count);

            var beer = world.Item('beer');
            beer.isUnique = false; // Allow multiple beers
            assert.equal(true, player.take(beer));
            // Can take multiple beers
            assert.equal(true, player.take(beer));
            // Check beer count
            assert.equal(2, player.getByName('beer').count);
            // Insist that beer has count of one while
            // 2 beers in player inventory
            assert.equal(0, beer.count);
        });

    });


    describe('remove from contents', function() {
        it('should remove items', function() {
            var player = world.Player();
            var beer = world.Item('beer');
            player.take(beer);
            player.drop(beer);
        });
    });

});


