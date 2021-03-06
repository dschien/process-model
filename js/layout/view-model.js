"use strict";

/*global module, require*/

var nearEndOfPath = function(path) {
    var len = path.length;

    if (len === 1) {
	return path[0];
    } else {
	return path[len - 2];
    }
};

/*
 Simple bags of properties representing the display properties of our model.
 */
module.exports = {
    edge: function(edge, path, collapsed, detailMode, onlyParent) {
	var e =  {
	    viewId: Math.random(),
	    parentId: edge.parent().id,
	    childId: edge.node().id,
	    canModify: !collapsed,
	    setEdgePath: function(newPath) {
		e.path = newPath;

		e.labelPosition = onlyParent ?
		    newPath[newPath.length - 1] :
		    nearEndOfPath(newPath);
	    }
	};

	e.setEdgePath(path);

	if (!collapsed && detailMode && edge.necessity) {
	    e.necessity = edge.necessity();
	    e.sufficiency = edge.sufficiency();
	}
	
	return e;
    },

    node: function(node, size, margin, position, collapsed, orientationCoords, detail, centred, effects) {
	var n = {
	    viewId: Math.random(),
	    id: node.id,
	    type: node.type,
	    collapsed: collapsed,
	    canCollapse: !collapsed && node.edges().length > 0,
	    name: node.name(),
	    description: node.description(),
	    isLeaf: node.isLeaf(),
	    x: position[0],
	    y: position[1],
	    effects: effects,
	    margin: margin,
	    centred: centred,
	    detail: detail,
	    
	    resize: function(newSize) {
		n.size = newSize;
		
		n.innerWidth = n.size[0] - (2 * margin.horizontal);
		n.innerHeight = n.size[1] - margin.top - margin.bottom;

		n.centre = [
		    n.size[0] * 0.5,
		    n.size[1] * 0.5
		];

		var offsetDirection = [
		    orientationCoords[0] / 2,
		    orientationCoords[1] / 2
		],

		    offsetVector = [
			offsetDirection[0] * n.size[0],
			offsetDirection[1] * n.size[1]
		    ];

		n.junctionOffset = [
		    n.centre[0] + offsetVector[0],
		    n.centre[1] + offsetVector[1]
		];

		n.edgeJunction = [
		    n.x + n.junctionOffset[0],
		    n.y + n.junctionOffset[1]
		];

		n.edgeOffset = [
		    n.centre[0] - offsetVector[0],
		    n.centre[1] - offsetVector[1]
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
