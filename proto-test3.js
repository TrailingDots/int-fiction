// https://www.gellock.com/2016/01/05/javascript-inheritance-patterns/
"use strict";

function Person(who) {
    this.me = who;
};

Person.prototype.identify = function() {
    return this.me;
};

Person.prototype.speak = function() {
    console.log('Hello, ' + this.identify() + ' here.');
};


function Rapper(who) {
    Person.call(this, who);
}

Rapper.prototype = Object.create(Person.prototype);

Rapper.prototype.identify = function() {
    // call the "parent"
    const temp = Person.prototype.identify.call(this);
    return temp + " (aka Mr. West)";
};


Rapper.prototype.rap = function() {
    console.log('Like we always do at this time\nI go for mine, I got to shine');
};

const r = new Rapper('Kanye');
r.speak();
r.rap();
