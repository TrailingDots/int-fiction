//
require("babel-register");

var world = require("../new-world.js");

var assert = require ("assert");
var inspect = require('util').inspect;

describe('Testing the Player object', function () {
    describe('adding to contents', function () {

        it('should have only the items taken', function() {
            var player = Object.create(world.Player);
            player.init();
            var lantern = Object.create(world.Item);
            lantern.init('brass lantern');
            lantern.description = 'A nice brass lantern';
            var whiskey = Object.create(world.Item);
            whiskey.init('whiskey');
            whiskey.description = 'Rot gut whiskey';

            player.inventory();

            assert.equal(true, player.take(lantern));
            assert.equal(true, player.take(whiskey));

            assert.equal(true, player.isCarrying(lantern));
            assert.equal(true, player.isCarrying(whiskey));


            // Cannot take immovable objects.
            var table = Object.create(world.Item);
            table.init('aTable');
            table.canCarry = false;
            assert.equal(false, player.take(table));
        });

        it('should track what a player is carrying', function () {
            var player = Object.create(world.Player);
            player.init('xyzzy');
            var lantern = Object.create(world.Item);
            lantern.init('brass lantern');
            lantern.description = 'A nice brass lantern';
            var whiskey = Object.create(world.Item);
            whiskey.init('whiskey');
            whiskey.description = 'Rot gut whiskey';

            player.take(lantern);
            assert.equal(true, player.isCarrying(lantern));
            assert.equal(false, player.isCarrying(whiskey));

            // A player can carry only one of an item.
            assert.equal(false, player.take(lantern));
        });

        it('should not take more than 1 item of the same kind', function() {
            var player = Object.create(world.Player);
            player.init('abc');
            var lantern = Object.create(world.Item);
            lantern.init('lantern');

            // take 1st lantern, OK
            assert.equal(true, player.take(lantern));
            // Cannot take 2nd lantern
            assert.equal(false, player.take(lantern));
        });

        it('should allow all objects to be created', function() {
            var container = Object.create(world.Container);
            container.init('barrel');
            var container_noname = Object.create(world.Container);
            container_noname.init();
            var room = Object.create(world.Room);
            room.init('kitchen');
            var room_noname = Object.create(world.Room);
            room_noname.init();
            var player = Object.create(world.Player);
            player.init('xyzzy');
            var player_noname = Object.create(world.Player);
            player_noname.init();

            world.say('This is the say fcn');
            world.blank();
            world.say('This is the say after a blank line.');
        });

        it('should allow rooms to be connected', function() {
            var room = Object.create(world.Room);
            room.init('room');
            var garden = Object.create(world.Room);
            garden.init('garden');
            assert.equal(true, room.addExit('n', garden));
            assert.equal(true, garden.addExit('s', room));
            assert.equal('garden', room.getExit('n').name);
            assert.equal('room', garden.getExit('s').name);
            assert.equal(undefined, garden.getExit('w'));
        });

    });

    describe('Player interactions', function() {
        it('should accept either a name or it defaults', function() {
            var player1 = Object.create(world.Player);
            player1.init();   // default name
            assert.equal('Frobitz', player1.name);

            var player2 = Object.create(world.Player);
            player2.init('Foobar'); // supplied name
            assert.equal('Foobar', player2.name);
        });

        it('should take only moveable items', function() {
            var player = Object.create(world.Player);
            player.init();

            var beer = Object.create(world.Item);
            beer.init('beer');
            beer.onlySingle = false;   // Can carry many bottle of beer
            var ret = player.take(beer);
            assert.equal(true, ret);

            var table = Object.create(world.Item);
            table.init('table');
            table.canCarry = false;  // Cannot be carried at all.
            ret = player.take(table);
            assert.equal(false, ret); // Canot take table
        });

        it('should take mulitple instances only if not unique', function() {
            var player = Object.create(world.Player);
            player.init('player');

            var gold = Object.create(world.Item);
            gold.init('gold');
            gold.onlySingle = false; // Allow multiple gold

            var ax = Object.create(world.Item);
            ax.init('ax');
            ax.onlySingle = true;     // only one ax per player

            var ret = player.take(ax);
            assert.equal(true, ret);
            // Cannot take another ax
            ret = player.take(ax);
            assert.equal(false, ret); // Could not take 2 axes.
            // Verify only one ax
            assert.equal(1, player.get('ax').count);

            var beer = Object.create(world.Item);
            beer.init('beer');
            beer.onlySingle = false; // Allow multiple beers
            assert.equal(true, player.take(beer));
            assert.equal(1, player.get('beer').count);
            console.log('beer count:' + player.get('beer').count);
            //
            // Can carry multiple beers
            assert.equal(true, player.take(beer));
            console.log('beer count:' + player.get('beer').count);
            //
            // Check beer count
            assert.equal(2, player.get('beer').count);
            console.log('beer count:' + player.get('beer').count);
            //
            // Insist that beer has count of one while
            // 2 beers in player inventory
            console.log('local beer count:' + beer.count);
            assert.equal(2, beer.count);


            // Start dropping beer.
            ret = player.drop('beer');
            assert.equal(1, player.get('beer').count);
            console.log('dropping beer count:' + player.get('beer').count);

            // One beer left, drop it
            ret = player.drop('beer');
            assert.equal(0, beer.count);
            console.log('dropping beer count ret:' + beer.count);

        });

    });


    describe('remove from contents', function() {
        it('should remove items', function() {
            var player = Object.create(world.Player);
            player.init();
            var beer = Object.create(world.Item);
            beer.init('beer');
            player.take(beer);
            player.drop(beer);
            assert.equal(false, player.isCarrying(beer));
        });
    });

    describe('Container operations', function () {
        it('should allow for pickup and droping objects', function () {
            var beer = Object.create(world.Item);
            beer.init('beer');
            var gold = Object.create(world.Item);
            gold.init('gold');
            var foobar = Object.create(world.Item);
            foobar.init('foobar');
            var player = Object.create(world.Player);
            player.init();
            assert.equal(true, player.take(beer));
            assert.equal(true, player.take(gold));

            // player drops beer
            assert.equal(true, player.drop(beer));
            assert.equal(false, player.isCarrying(beer));
            assert.equal(true, player.isCarrying(gold));
            assert.equal(true, player.isCarrying('gold'));
            assert.equal(false, player.isCarrying('foobar'));
            assert.equal(false, player.isCarrying(foobar));

            // dropping something the player does not have results in false
            assert.equal(false, player.drop(foobar));
        });
    });

    describe('Container operations ', function () {
        it('should allow for pickup and droping objects ', function () {
            var beer = Object.create(world.Item);
            beer.init('beer');
            var gold = Object.create(world.Item);
            gold.init('gold');
            var foobar = Object.create(world.Item);
            foobar.init('foobar');
            var player = Object.create(world.Player);
            player.init();  // default name

            assert.equal(true, player.take(beer));
            assert.equal(false, player.take(undefined));
            assert.equal(true, player.take(gold));

            // player drops beer
            assert.equal(true, player.drop('beer'));
            assert.equal(false, player.isCarrying('beer'));
            assert.equal(false, player.isCarrying(undefined));
            assert.equal(true, player.isCarrying('gold'));

            // dropping something the player does not have results in false
            assert.equal(false, player.drop('foobar'));
            assert.equal(false, player.drop(foobar));
        });
    });

    describe('A room and all operations on its contents and exits', function() {
        it('should contain furniture - add a remove, inventory', function () {
            var chair = Object.create(world.Item);
            chair.init('chair');
            var table = Object.create(world.Item);
            table.init('table');
            table.onlySingle = true;  // Only 1 table for this room.
            var stool = Object.create(world.Item);
            stool.init('stool');
            var scroll = Object.create(world.Item);
            scroll.init('scroll');
            var room = Object.create(world.Room);
            room.init('room');
            
            assert.equal(true, room.take(chair));
            assert.equal(true, room.take(table));
            assert.equal(true, room.isCarrying(chair));
            assert.equal(true, room.isCarrying('chair'));
            assert.equal(true, room.isCarrying('table'));
            room.inventory();
            var invList = room.inventoryList();
            assert.equal(2, invList.length);

            assert.equal('table', room.get(table).name);
            //var ret = room.drop('table');
            assert.equal(false, room.take(table)); // only 1 table
            assert.equal(true, room.drop('table'));
            assert.equal(false, room.isCarrying('table'));

            // Use objects instead of names.
            assert.equal(true, room.take(table));
            assert.equal(true, room.drop(table));
            assert.equal(false, room.isCarrying(table));

            assert.equal('chair', room.get('chair').name);



            //
            // take the table back up
            assert.equal(true, room.take(table));
            assert.equal(true, room.drop(table));
            var inv = room.inventoryList();
            console.log('room inv list: ' + inspect(inv));
        });
    });

});


