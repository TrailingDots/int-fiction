// This and Object Prototypes, p. 101, inheritance with prototypes
var inspect = require('util').inspect;
function Foo(name) {
    this.name = name;
}

Foo.prototype.myName = function() {
    return this.name;
};

function Bar(name, label) {
    Foo.call(this, name);
    this.label = label;
}

Bar.prototype = Object.create(Foo.prototype);

Bar.prototype.myLabel = function() {
    return this.label;
};
console.log('Bar:\n' + inspect(Bar) + '\nend of Bar\n');

var a = new Bar("a", "obj a");  // What is the purpose of "new"???
console.log('a inspect:\n' + inspect(a) + '\nend of a\n');

var aName = a.myName();   // "a"
var aLabel = a.myLabel();   // "obj a"
console.log('a.myName:"' + a.myName() + '"  ' + aName);
console.log('a.myLabel:"' + a.myLabel() + '"  ' + aLabel);

console.log('\n b');
var b = new Bar("b", "obj b");  // What is the purpose of "new"???
var bName = b.myName();   // "b"
var bLabel = b.myLabel();   // "obj b"
console.log('b.myName:"' + b.myName() + '"  ' + bName);
console.log('b.myLabel:"' + b.myLabel() + '"  ' + bLabel);

