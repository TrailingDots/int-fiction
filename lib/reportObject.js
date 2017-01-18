
// Ref: http://stackoverflow.com/questions/7440001/iterate-over-object-keys-in-node-js
//
//require("babel-register");
'use strict';

//console.log("START: AFutils");

//
// Recusive console output report of an Object
//
// Use this as AFutils.reportObject(req, "", 1, 3); // To list all items in req
// object by 3 levels
//
// Use this as AFutils.reportObject(req, "headers", 1, 10); // To find
// "headers" item and then list by 10 levels
//
// Yes, I'm OLD School!  I like to see the scope start AND end!!!  :-P
//
function reportObject(obj, in_key, in_level, in_deep) {
    if (!obj) { 
        return;
    }
    var key = in_key || '';
    var level = in_level || 1;
    var deep = in_deep || 3;

    var nextLevel = level + 1;

    var keys, typer, prop;
    if(key !== "") {   // requested field
        keys = key.split(']').join('').split('[');
    } else {   // do for all
        keys = Object.keys(obj);
    }

    var len = keys.length;
    var add = "";
    for(var j = 1; j < level; j++) {
        // I would normally do {add = add.substr(0, level)} of a precreated
        // multi-tab [add] string here, but Sublime keeps replacing with
        // spaces, even with the ["translate_tabs_to_spaces": false] setting!!!
        // (angry)
        add += "\t";
    }

    for (var i = 0; i < len; i++) {
        prop = obj[keys[i]];
        if (!prop) {
            // Don't show / waste of space in console window...
            //console.log(add + level + ": UNDEFINED [" + keys[i] + "]");
        } else {
            typer = typeof(prop);
            if (typer === "function") {
                // Don't bother showing fundtion code...
                console.log(add + level + ": [" + keys[i] + "] = {" + typer + "}");
                return;
            }
            if (typer === "object") {
                console.log(add + level + ": [" + keys[i] + "] = {" + typer + "}");
                if (nextLevel <= deep) {
                    // drop the key search mechanism if first level item has been found...
                    this.reportObject(prop, "", nextLevel, deep); // Recurse into
                }
                return;
            }

            // Basic report
            console.log(add + level + ": [" + keys[i] + "] = {" + typer + "} = " + prop + ".");
        }
    }

    return ;
}

module.exports.reportObject = reportObject;
//console.log("END: AFutils");

