// Ref: https://www.gellock.com/2016/01/05/javascript-inheritance-patterns/
// The OLOO pattern
"use strict";

// objects linked to other objects
// oloo pattern as presented by Kyle Simpson

const Person = {

    init: function(who) {
        this.me = who;
    },

    identify: function() {
        return this.me;
    },

};



const Rapper = Object.create(Person);

Rapper.speak = function() {
    console.log('Hello, ' + this.identify() + ' here.');
};

Rapper.rap = function() {
    console.log('Like we always do at this time\nI go for mine, I got to shine');
};


const r = Object.create(Rapper);

r.init('Kanye');
r.speak();
r.rap();
