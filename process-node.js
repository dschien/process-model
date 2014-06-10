"use strict";

/*global d3, ProcessModel */

if (!ProcessModel) {
    var ProcessModel = {};
}

ProcessModel.Nodes = function() {
    var nodes = d3.map({}),
	newNodes = 1;

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

    var removeUnreachable = function(root) {
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

    var module = {
	all : function() {
	    return nodes.values();
	},
	create : function(startName) {
	    var localN = 1,
		localS = 1,
		localE = [Math.random() / 2, 0.5 + (Math.random() / 2)],
		edges = [],
		name = startName ? startName : "new " + newNodes++,
		description = "";
	    
	    var node = {
		localEvidence: function(evidence) {
		    if (evidence) {
			localE = evidence;
			return node;
		    }
		    return localE;
		},
		localNecessity: function(necessity) {
		    if (necessity) {
			localN = necessity;
			return node;
		    }
		    return localN;
		},
		localSufficiency: function(sufficiency) {
		    if (sufficiency) {
			localS = sufficiency;
			return node;
		    }
		    return localS;
		},
		edges: function() {
		    return edges;
		},
		addEdge: function(to) {
		    var edge = ProcessModel.Edge(node, to);

		    var joinedNodes = edges.map(function(e){
			return e.node();
		    });

		    if (joinedNodes.indexOf(edge.node()) >= 0) {
			return node; // This connection already exists.
		    }

		    edges.push(edge);
		    try {
			assertNoCycles(edge.node());
		    } catch (err) {
			edges.splice(edges.indexOf(edge), 1);
			throw err;
		    }
		    return node;
		},
		removeEdge : function(edge, rootNode) {
		    edges.splice(edges.indexOf(edge), 1);
		    removeUnreachable(rootNode);
		},
		edgeTo : function(node) {
		    var edgeTo;

		    edges.forEach(function(e){
			if (e.node() === node) {
			    edgeTo = e;
			}
		    });

		    if(!edgeTo) {
			throw "Could not find an edge leading to node " + node;
		    }

		    return edgeTo;
		},
		p: function() {
		    /* This is not the real interval probability calculation, but a placeholder. */
		    var nNorm = localN,
			sNorm = localS,
			evidence = [localE[0] * localN, localE[1] * localS];

		    edges.forEach(function(edge){
			var p = edge.node().p();
			nNorm += edge.necessity();
			evidence[0] += p[0] * edge.necessity();
			sNorm += edge.sufficiency();
			evidence[1] += p[1] * edge.sufficiency();
		    });

		    evidence[0] = evidence[0] / nNorm;
		    evidence[1] = evidence[1] / sNorm;

		    return evidence;
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
		description: function(d) {
		    if (d) {
			description = d;
			return node;
		    }
		    return description;
		}
	    };

	    nodes.set(node.name(), node);
	    return node;
	}
    };
    return module;
};

ProcessModel.Edge = function(from, to) {
    var necessity = 1,
	sufficiency = 1;

    var edge = {
	necessity : function(n) {
	    if (n) {
		necessity = n;
		return edge;
	    }
	    return necessity;
	},
	sufficiency : function(s) {
	    if (s) {
		sufficiency = s;
		return edge;
	    }
	    return sufficiency;
	},
	node: function() {
	    return to;
	},
	/* Removes the edge. Tests if any nodes are now unreachable from the root node, and removes them too. */
	disconnect: function(rootNode) {
	    from.removeEdge(edge, rootNode);
	}
    };
    return edge;
};

