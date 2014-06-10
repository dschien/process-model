"use strict";

/*global ProcessModel*/

if (!ProcessModel) {
    var ProcessModel = {};
}

ProcessModel.Data = function(nodes) {
    var serializeEdge = function(edge) {
	return {
	    necessity: edge.necessity(),
	    sufficiency: edge.sufficiency(),
	    to: serializeNode(edge.node())
	};
    };

    var serializeNode = function(node) {
	return {
	    name: node.name(),
	    description: node.description(),
	    evidence: node.localEvidence(),
	    necessity: node.necessity(),
	    sufficiency: node.sufficiency(),
	    edges: node.edges().map(serializeEdge)
	};
    };

    var deserializeNode = function(node) {
	var deserialized = nodes.get(node.name);

	if (deserialized) {
	    return deserialized;
	}

	deserialized = nodes.create(node.name)
	    .localEvidence(node.evidence)
	    .necessity(node.necessity)
	    .sufficiency(node.sufficiency);

	node.edges.forEach(function(e){
	    var target = deserializeNode(e.to);
	    deserialized.addEdge(target);
	    deserialized.edgeTo(target)
		.necessity(e.necessity)
		.sufficiency(e.sufficiency);
	});

	return deserialized;
    };

    var module = {
	serialize: function(rootNode) {
	    return JSON.stringify(serializeNode(rootNode));
	},
	deserialize: function(json) {
	    return deserializeNode(JSON.parse(json));
	}
    };
    return module;
};
