"use strict";

/*global parent, require*/

var updating = false,
    update = function() {
	if (updating) {
	    return;
	}

	try {
	    updating = true;

	    if (model.empty()) {
		model.set(model.freshModel());
	    }

	    modelOperations.writeBufferedOperations();
	    fileMenu.queryString.toURL();
	    serialization.exportButton().update();
	    if (fileMenu.menu()) {
		fileMenu.menu().updateButtons();
	    }

	    draw.update(
		layout()
	    );

	    fitButton.update();
	    rotateButton.update();
	    depthSlider.update();

	} finally {
	    updating = false;
	}
    };

var d3 = require("d3"),
    URL = require("url"),
    body = d3.select("body"),

    toolbar = body.append("div")
	.attr("id", "toolbar"),
    
    svg = d3.select("svg#model"),

    helpers = require("./helpers.js"),
    callbacks = helpers.callbackHandler,

    model = require("./state/model.js")(),

    serialization = require("./serialization/serialization.js")(body, model),
    
    fileMenu = require("multiuser-file-menu")(
	"process-models",
	"process-model",
	serialization.jsonSerialize,
	serialization.jsonDeserialize,
	model.get,
	model.set,
	model.freshModel,
	null,
	"http://tools.smartsteep.eu/wiki/User_Manual#Process_modelling_tool"
    ),    
    
    modelOperations = require("./serialization/model-operations.js")(fileMenu.store.writeOp, fileMenu.store.onOp, model.getNodes, model.getLayout, model.set, model.onSet, update),

    draw = require("./draw/draw.js")(body, svg, fileMenu.queryString, model.getNodes, model.getLayout, model.getSavedViewpoint, modelOperations.writeBufferedOperations, update),    

    insertButton = require("./insert-button.js")(
	fileMenu.store.loadSnapshot,
	model.merge,
	update,
	fileMenu.spec.button),

    zoomButtons = draw.viewpoint.makeZoomButtons(toolbar),
    fitButton = draw.viewpoint.makeFitButton(toolbar),
    rotateButton = require("./layout/rotate-button.js")(toolbar, model.getLayout, update),
    margins = require("./margins.js")(update, toolbar),    
    depthSlider = require("./depth-slider.js")(toolbar, model.getNodes, model.getLayout, update),
    layout = require("./layout/layout.js")(model.getNodes, model.getLayout, draw.viewpoint, margins),
    fileMenuContents = fileMenu.buildMenu(
	body
    ),
    standardButtons = fileMenuContents.standardButtons;

require("./layout/reset-layout-button.js")(toolbar, model.getLayout, update);
draw.viewpoint.makeLoadViewpointButton(toolbar);

standardButtons.insertBefore(
    draw.viewpoint.makeSetViewpointButton(
	fileMenu.spec.button, model.setSavedViewpoint
    ),
    standardButtons.historyButton
);

standardButtons.insertBefore(
    insertButton,
    standardButtons.deleteButton
);
standardButtons.insertBefore(
    serialization.exportButton(fileMenu).spec,
    standardButtons.deleteButton
);

fileMenuContents.setButtons(standardButtons.ordered);

model.onSet(function() {
    draw.viewpoint.onSetModel();
    update();
});

fileMenu.queryString.fromURL();
