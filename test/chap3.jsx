// Replaces example on p66.
// https://github.com/stampit-org/stampit/blob/master/docs/pjabook-updated-examples.md
// Run with:   babel-node chap3.js
import stampit from 'stampit';
import test from 'tape';
var testObj = stampit({
  // methods in v1
  methods: {
    delegateMethod: function delegateMethod() {
      return 'shared property';
    }
  },

  // state in v1
  refs: {
    instanceProp: 'instance property'
  },

  // enclose in v1
  init: {
    function () {
      var privateProp = 'private property';

      this.getPrivate = function getPrivate() {
        return privateProp;
      }
    }
  }
}).create();

test('Stampit options object', function () {
  equal(testObj.delegateMethod(), 'shared property',
    'delegate methods should be reachable');

  ok(Object.getPrototypeOf(testObj).delegateMethod,
    'delegate methods should be stored on the ' +
    'delegate prototype');

  equal(testObj.instanceProp, 'instance property',
    'state should be reachable.');

  ok(testObj.hasOwnProperty('instanceProp'),
    'state should be instance safe.');

  equal(testObj.hasOwnProperty('privateProp'), false,
    'should hide private properties');

  equal(testObj.getPrivate(), 'private property',
    'should support privileged methods');
});
