/*

    doc.js

    documentation for custom block support for JASM!

    written by codingisfun2831
    Copyright (C) 2024 by codingisfun2831

    This file is part of JASM!.

    JASM! is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of
    the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.


    prerequisites:
    --------------
    needs blocks.js, byob.js 

    toc
    ---
    the following list shows the order in which all constructors are
    defined. Use this list to locate code in this document:

        Documentation

*/

/*global modules*/

/*jshint esversion: 11*/

// Global stuff ////////////////////////////////////////////////////////

modules.doc = '2025-October-05';

// Declerations
var Documentation;

// Documentation ///////////////////////////////////////////////////////
/*
    I am a collection of documenation info from a custom block.

    My constructor takes in a CustomBlockDefinition, and creates a set of
    info about that custom block, using the documentation blocks avaiable
    with the "Documention blocks" checkbox in gui.js.
*/

// Documentation instance creation:
function Documentation(def) {
    this.init(def);
}

Documentation.prototype.init = function(def) {
    this.description = "No description avaiable.";
    this.params = new Map();
    this.examples = new Map();
    this.type = def.type;
    this.category = def.category;

    console.log(def);

    if (def.type == 'reporter' || def.type == 'predicate') {
        this.return = "No return info avaiable.";
    } else {
        this.return = null;
    }

    this.parse(def);
}

// Documentation parsing:
Documentation.prototype.parse = function(def) {
    var expr,
        children,
        inps;

    // vaildity
    if (
        // vaild definiton and body?
        !(def instanceof CustomBlockDefinition) ||
        def.body == null || 
        def.body.expression == null ||
        
        // expression is a doc?
        def.body.expression.selector != 'nopDoc'
    ) {
        return;
    }

    // use the comment as the description (if a nopDocDesc is
    // found, it will overwrite this)
    if (def.comment) {
        this.description = def.comment.text();
    }

    // get the children of that doc
    expr = def.body.expression;
    children = expr.inputs()[0].evaluate().blockSequence();

    children.forEach(block => {
    console.log(block);
        switch (block.selector) {
            case 'nopDocDesc': // description
                this.description = block.inputs()[0].evaluate();
                break;
            case 'nopDocParam': // param
                inputs = block.inputs();
                this.params.set(inputs[0].evaluate(), inputs[1].evaluate());

                break;
            case 'nopDocReturn': // return
                if (def.type == 'reporter' || def.type == 'predicate') {
                    this.return = block.inputs()[0].evaluate();
                }

                break;
            case 'nopDocExample': // example
                inputs = block.inputs();
                this.examples.set(inputs[0].evaluate(), inputs[1].children[0].children[0].toLisp());

                break;
        }
    });
}

// Documentation conversion to a Snap! List (for doc_parse extension block):
Documentation.prototype.toSnapList = function () {
    function snapTableFromMap(map) {
        return new List(
            Array.from(map.entries()).map((item) => new List(item))
        )
    }
    return new List([
        this.description,
        snapTableFromMap(this.params),
        snapTableFromMap(this.examples),
        this.return || '',
        this.type,
        this.category
    ]);
}

// Documentation from List:
Documentation.fromList = function(list) {
    function mapFromSnapTable(snapTable) {
        var map = new Map();

        snapTable.asArray().map(item => {
            map.set(item.at(1), item.at(2));
        })

        return map;
    }

    var doc = Object.create(Documentation.prototype);

    doc.description = list.at(1);
    doc.params = mapFromSnapTable(list.at(2));
    doc.examples = mapFromSnapTable(list.at(3));
    doc.return = list.at(4) == '' ? null : list.at(4);
    doc.type = list.at(5);
    doc.category = list.at(6);

    return doc;
}

// Documentation conversion to HTML code:
Documentation.prototype.toHTML = function(proc) {
    var doc = document.implementation.createHTMLDocument("Block Documenation"),
        metaTags = {
            viewport: 'width=device-width, initial-scale=1',
            description: 'Block Documentation',
            keywords: 'block, doc, snap'
        },
        element,
        list;

    // Meta tags
    element = doc.createElement('meta')
    element.httpEquiv = 'Content-Type';
    element.content = 'text/html; charset=UTF-8';
    doc.head.appendChild(element);

    Object.entries(metaTags).forEach(([name, content]) => {
        element = doc.createElement('meta')
        element.name = name;
        element.content = content;
        doc.head.appendChild(element);
    });

    // header
    element = doc.createElement("h1");
    element.textContent = "Block Documentation";
    doc.body.appendChild(element);

    // basic info
    doc.body.appendChild(doc.createTextNode("Type: " + this.type));
    doc.body.appendChild(doc.createElement("br"));

    doc.body.appendChild(doc.createTextNode("Category: " + this.category));
    doc.body.appendChild(doc.createElement("br"));

    // description
    element = doc.createElement("p");
    element.textContent = this.description;
    doc.body.appendChild(element);

    // params
    element = doc.createElement("h1");
    element.textContent = 'Parameters';
    doc.body.appendChild(element);
    
    list = doc.createElement("ul");
    Array.from(this.params.entries()).forEach(([name, desc]) => {
        element = doc.createElement("li");
        element.textContent = name + ': ' + desc;
        list.appendChild(element);
    });
    doc.body.appendChild(list);

    // examples - commented out for now
    // element = doc.createElement("h1");
    // element.textContent = 'Examples';
    // doc.body.appendChild(element);
    
    // list = doc.createElement("ul");
    // Array.from(this.examples.entries()).forEach(([text, lisp]) => {
    //     var block,
    //         canvas,
    //         img;

    //     block = proc.assemble(proc.parseCode(lisp));
    //     canvas = block.expression.fullImage();
    //     img = document.createElement("img");
    //     img.src = canvas.toDataURL();

    //     element = doc.createElement("li");
    //     element.appendChild(doc.createTextNode("text"));
    //     element.appendChild(doc.createElement("br"));
    //     element.appendChild(img);

    //     list.appendChild(element);
    // });
    // doc.body.appendChild(list);

    return '<!DOCTYPE html>\n<!-- This file was generated by Snap! -->\n' + doc.documentElement.outerHTML;
}