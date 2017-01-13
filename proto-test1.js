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

var Bar = Object.create(Foo);

Bar.prototype.speak = function() {
    console.log("Hello, " + this.identify() + ".");
};

var b1 = Object.create(Bar);
b1.init("b1");
var b2 = Object.create(Bar);
b2.init("b2");

b1.speak(); // alerts: "Hello, I am b1."
b2.speak(); // alerts: "Hello, I am b2."
