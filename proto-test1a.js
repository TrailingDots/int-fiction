// https://davidwalsh.name/javascript-objects-deconstruction
'use strict';
function Foo () {
    this.me = '';
};
Foo.init = function (who) {
    this.me = who;
}
Foo.prototype.identify = function() {
    return "I am " + this.me;
};
Foo.say = function() {
    return "I say I am " + this.me;
};


var Bar = Object.create(Foo);

Bar.prototype.speak = function() {
    console.log("Hello, " + this.identify() + ".");
};

Bar.say = function() {
    return "In Bar, I say I am " + this.me;
};

var b1 = Object.create(Bar);
b1.init("b1");
var b2 = Object.create(Bar);
b2.init("b2");

console.log('speaking:');
console.log('b1.speak:' + b1.speak()); // "Hello, I am b1."
console.log('b2.speak:' + b2.speak()); // "Hello, I am b2."

console.log('saying');
console.log('b1:' + b1.say());
console.log('b2:' + b2.say());


