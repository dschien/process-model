"use strict";

/*global module, require*/

/*
 Simple bags of properties representing the display properties of our model.
 */
module.exports = {
    edge: function(edge, path, collapsed) {
	var e =  {
	    viewId: Math.random(),
	    parentId: edge.parent().id,
	    childId: edge.node().id,
	    path: path,
	    canModify: !collapsed
	};
	
	if (!collapsed && edge.necessity) {
	    e.necessity = edge.necessity();
	    e.sufficiency = edge.sufficiency();
	}
	
	return e;
    },

    node: function(node, size, margin, position, collapsed, orientationCoords, effects) {
	var n = {
	    viewId: Math.random(),
	    id: node.id,
	    type: node.type,
	    collapsed: collapsed,
	    name: node.name(),
	    description: node.description(),
	    isLeaf: node.isLeaf(),
	    x: position[0],
	    y: position[1],
	    effects: effects,
	    resize: function(newSize) {
		n.size = newSize;
		
		n.innerWidth = n.size[0] - (2 * margin.horizontal);
		n.innerHeight = n.size[1] - (2 * margin.vertical);

		var fromCentre = [
		    orientationCoords[0] / 2,
		    orientationCoords[1] / 2
		];

		n.junctionOffset = [
		    n.size[0] * (fromCentre[0] + 0.5),
		    n.size[1] * (fromCentre[1] + 0.5)
		];

		n.edgeJunction = [
		    n.x + n.junctionOffset[0],
		    n.y + n.junctionOffset[1]
		];

		n.edgeOffset = [
		    n.size[0] * (0.5 - fromCentre[0]),
		    n.size[1] * (0.5 - fromCentre[1])
		];

		n.edgeEnd = [
		    n.x + n.edgeOffset[0],
		    n.y + n.edgeOffset[1]
		];
	    }
	};

	/*
	 When resizing a node, we should call this to make sure that some things inside it get put in the right place.

	 This is because we redraw the node individually and quickly, without recreating its view-model, up until the point when the resize finishes completely.
	 */
	n.resize(size);

	switch (node.type) {
	case "process":
	    n.evidence = node.p();
	    n.dependence = node.dependence();
	    n.hasChildProcesses = node.hasChildProcesses();
	    
	    break;
	case "issue":
	    n.settled = node.settled();
	    
	    break;
	case "option":
	    break;
	case "argument":
	    n.support = node.support();
	    
	    break;
	case "undecided":
	    break;
	default:
	    throw new Error("Unknown type of node " + node.type);
	}
	
	return n;
    }
};
