"use strict";

/*global d3, ProcessModel */

if (!ProcessModel) {
    var ProcessModel = {};
}

ProcessModel.Nodes = function() {
    var nodes, newNodes, root;

    var assertNoCycles = function(node) {
	var assertNoCyclesAccum = function(node, seen) {
	    if (seen.indexOf(node.name()) >= 0) {
		throw "Cycle detected";
	    }

	    node.edges().forEach(function(e){
		var copy = seen.slice(0);
		copy.push(node.name());
		assertNoCyclesAccum(e.node(), copy);
	    });
	};
	
	assertNoCyclesAccum(node, []);
    };

    var removeUnreachable = function() {
	var findUnreachableAccum = function(node, unreached) {
	    unreached.remove(node.name());
	    node.edges().forEach(function(e){
		findUnreachableAccum(e.node(), unreached);
	    });
	};

	var unreached = d3.set(nodes.keys());
	findUnreachableAccum(root, unreached);
	unreached.forEach(function(n){
	    nodes.remove(n);
	});
    };

    var edgesToNode = function(node) {
	var edges = [],
	    stack = [root];

	while (stack.length > 0) {
	    stack.pop().edges().forEach(function(e){
		if (e.node() === node) {
		    edges.push(e);
		} else {
		    stack.push(e.node());
		}
	    });
	}

	return edges;
    };

    var module = {
	registerType: function(key, extendNode) {
	    ProcessModel.Nodes.types.set(key, extendNode);
	},
	all : function() {
	    return nodes.values();
	},
	has: function(nodeName) {
	    return nodes.has(nodeName);
	},
	get : function(nodeName) {
	    return nodes.get(nodeName);
	},
	reset: function() {
	    nodes = d3.map({});
	    newNodes = 1;
	    root = null;
	},
	root: function(newRoot) {
	    if (newRoot) {
		root = newRoot;
		return this;
	    }
	    return root;
	},
	create : function(type, startName) {
	    if (nodes.has(startName)) {
		throw new Error("Tried to create a node that already exists " + startName);
	    }

	    if (!ProcessModel.Nodes.types.has(type)) {
		throw new Error("Unknown type of node " + type);
	    }

	    var edges = [],
		url = null,
		name = startName ? startName : "new " + newNodes++;

	    var node = {
		type: type,
		childTypes: function() {
		    throw new Error("Child types was not implemented for node of type " + type);
		},
		incomingEdges: function() {
		    return edgesToNode(node);
		},
		extendIncomingEdge: function(edge) {
		    return edge;
		},
		isLeaf : function() {
		    return edges.length === 0;
		},
		edges: function() {
		    return edges;
		},
		removeEdge : function(edge) {
		    edges.splice(edges.indexOf(edge), 1);
		    removeUnreachable();
		},
		edgeTo : function(to) {
		    var existingEdge;
		    edges.forEach(function(e){
			if (e.node() === to) {
			    existingEdge = e;
			}
		    });
		    if (existingEdge) {
			return existingEdge;
		    }

		    var edgeTo = module.edge(node, to);
		    edges.push(edgeTo);
		    try {
			assertNoCycles(node);
			return edgeTo;
			
		    } catch (err) {
			edges.splice(edges.indexOf(edgeTo), 1);
			throw err;
		    }
		},
		name: function(n) {
		    if (n) {
			if (nodes.has(n)) {
			    throw "Name already taken " + n;
			}

			nodes.remove(name);
			name = n;
			nodes.set(n, node);
			
			return node;
		    }
		    return name;
		},
		url: function(u) {
		    if (u) {
			url = u;
			return this;
		    }
		    return url;
		},
		countDescendents: function() {
		    var seen = [],
			stack = edges.slice(0);

		    while(stack.length > 0) {
			var current = stack.pop().node();
			if (seen.indexOf(current) < 0) {
			    seen.push(current);
			    current.edges().forEach(function(e){
				stack.push(e);
			    });
			}
		    }

		    return seen.length;
		},
		canCollapse: function() {
		    return !node.isLeaf();
		}
	    };

	    if (nodes.empty()) {
		root = node;
	    }
	    nodes.set(node.name(), node);

	    ProcessModel.Nodes.types.get(type)(node);

	    return node;
	},
	edge: function(from, to) {
	    if (!(to.type === 'undecided' || from.allowedChildren.has(to.type))) {
	    	throw new Error("Cannot connect node of type " + from.type + " to node of type " + to.type);
	    }

	    var edge = {
		node: function() {
		    return to;
		},
		parent: function() {
		    return from;
		},
		/* Removes the edge. Tests if any nodes are now unreachable from the root node, and removes them too. */
		disconnect: function() {
		    from.removeEdge(edge);
		}
	    };

	    to.extendIncomingEdge(edge);
	    return edge;
	}
    };

    module.reset();
    return module;
};

ProcessModel.Nodes.types = d3.map();