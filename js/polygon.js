"use strict"

//objects
function Polygons() {
	this.polygons = [];
	this.verticeBuffer = [];
	
	this.reset = function() {
		this.clearVerticeBuffer();
		this.destroyAllPolygons();
	}
	
	this.addVertice = function( vertice ) {			//takes a point
		if( this.closePolygon( vertice ) ) {							//if its "closed"?
			this.addPolygon();
			this.createWorldPolygon();
			this.clearVerticeBuffer();
		} else {
			this.verticeBuffer.push( vertice );
		}
	}
	
	this.createWorldPolygon = function() {
		var polyBody = createBody( 0,0,true );
		polyBody.userData = createUserData( 'polydraw' + this.polygons.length );
		
		var polyPoints = convertArrayPxToPoints( copyArray( this.verticeBuffer ) );
		var polyFixDef = createFixdefPolygon( polyPoints );
		world.CreateBody( polyBody ).CreateFixture( polyFixDef );
	}
	
	this.destroyLastPolygon = function() {
		deleteList.push( 'polydraw' + this.polygons.length );
		this.polygons.pop();
	}
	
	this.destroyAllPolygons = function() {
		var tempPolyLength = this.polygons.length;
		for( var e = 0; e < tempPolyLength; e++ ) {
			this.destroyLastPolygon();
		}
	}
	
	this.drawVertices = function() {
		if( this.verticeBuffer.length > 0 ) {
			for( var i = 1; i < this.verticeBuffer.length; i++ ) {
				drawLine( this.verticeBuffer[ i - 1 ], this.verticeBuffer[ i ] );
			}
			drawLine( this.verticeBuffer[ this.verticeBuffer.length - 1 ], new Point( mouseX, mouseY ) );
		}
	}
	
	this.closePolygon = function( vertice ) {						//if the latest point is near the start point, close the polygon
		var threshold = CLOSE_THRESHOLD / 2;
		if( this.verticeBuffer.length > 2 ) {
			var startX = this.verticeBuffer[ 0 ].x;
			var startY = this.verticeBuffer[ 0 ].y;
			//if its within the "close" threshold
			if( ( vertice.x > startX - threshold ) && ( vertice.x < startX + threshold ) ) {
				if( ( vertice.y > startY - threshold ) && ( vertice.y < startY + threshold ) ) {
					return true;
				}
			}
		}
	}
	
	this.clearVerticeBuffer = function() {
		this.verticeBuffer = [];
	}
	
	this.addPolygon = function() {
		this.polygons.push( this.verticeBuffer );
	}
	
	this.drawPolygons = function() {
		for( var s = 0; s < this.polygons.length; s++ ) {
			ctx.beginPath();
			ctx.moveTo( this.polygons[s][0].x, this.polygons[s][0].y );
			
			for( var t = 1; t < this.polygons[s].length; t++ ) {
				ctx.lineTo( this.polygons[s][t].x, this.polygons[s][t].y);
			}
			
			ctx.fillStyle = COLORS[ polygonsCurrentColor ];
			ctx.globalAlpha = polygonsCurrentAlpha;
			ctx.fill();			
			ctx.globalAlpha = 1;
		}
		
		if( mirrorMode ) {
			for( var s = 0; s < this.polygons.length; s++ ) {
				ctx.beginPath();
				ctx.moveTo( this.polygons[s][0].x, CANVAS_HEIGHT - this.polygons[s][0].y );
				for( var t = 1; t < this.polygons[s].length; t++ ) {
					ctx.lineTo( this.polygons[s][t].x, CANVAS_HEIGHT - this.polygons[s][t].y);
				}
				
				ctx.fillStyle = COLORS[ polygonsCurrentColor2 ];
				ctx.globalAlpha = polygonsCurrentAlpha;
				ctx.fill();			
				ctx.globalAlpha = 1;
			}
		}
	}
	
	this.clearPolygons = function() {
		this.polygons = [];
	}
}

function Point( x, y ) {
	this.x = x;
	this.y = y;
}

function ShapeDataType( type, dimensions, location ) {			//data type for renderlist
	this.type = type;
	this.dimensions = dimensions;
	this.location = location;
}

function FrontEndDrawing() {
	this.renderList = [];
	
	this.clearCanvas = function() {							//should be temp as I need to move static polygon stuff into frontenddrawing code
		ctx.fillStyle = COLORS[ backgroundCurrentColor ];
		ctx.globalAlpha = feedbackAlpha;
		ctx.fillRect ( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );
		ctx.globalAlpha = 1;
	}
	
	this.clearRenderList = function() {
		this.renderList = [];
	}
	this.addToRenderList = function( data ) {
		this.renderList.push( data );
	}
	this.iterateRenderList = function() {
		ctx.fillStyle = '#' + COLORS[ bodiesCurrentColor ];
		for( var f=0; f < this.renderList.length; f++ ) {
			if( this.renderList[f].type == 'circle' ) {
				this.drawCircle( this.renderList[f].dimensions, this.renderList[f].location );
			} else if( this.renderList[f].type == 'polygon' ) {
				this.drawPolygon( this.renderList[f].dimensions );
			}
		}
	}
	this.drawPolygon = function( data ) {
		ctx.fillStyle = '#' + COLORS[ bodiesCurrentColor ];				//this is a bit shit and should be changed for gen purpose stuff
		ctx.beginPath();
		ctx.moveTo( data[0].x, data[0].y );
		for( var t = 1; t < data.length; t++ ) {
			ctx.lineTo( data[t].x, data[t].y);
		}
		ctx.fill();
		
		if( mirrorMode ) {
			ctx.fillStyle = COLORS[ bodiesCurrentColor2 ];
			ctx.beginPath();
			ctx.moveTo( data[0].x, CANVAS_HEIGHT - data[0].y );
			for( var t = 1; t < data.length; t++ ) {
				ctx.lineTo( data[t].x, CANVAS_HEIGHT - data[t].y);
			}
			ctx.fill();
		}
	}
	
	this.drawCircle = function( radius, location ) {
		ctx.fillStyle = COLORS[ bodiesCurrentColor ];
		ctx.beginPath();
		ctx.arc(location.x, location.y, radius, 0, 2 * Math.PI, false);
		ctx.fill();
		if( mirrorMode ) {
			ctx.fillStyle = COLORS[ bodiesCurrentColor2 ];
			ctx.beginPath();
			ctx.arc(location.x, CANVAS_HEIGHT - location.y, radius, 0, 2 * Math.PI, false);
			ctx.fill();
		}
	}
}

//helpers
//this and below are similar, maybe try to combine them or something
function copyArray( toBeCopied ) {
	var newCopy = [];
	for( var w = 0; w < toBeCopied.length; w++ ) {
		newCopy.push( toBeCopied[ w ] );
	}
	return newCopy;
}

function convertArrayPxToPoints( toBeCopied ) {
	var newCopy = [];
	for( var w = 0; w < toBeCopied.length; w++ ) {
		newCopy.push( new Point( pixToUnits( toBeCopied[w].x ), pixToUnits( toBeCopied[w].y ) ) );
	}
	return newCopy;
}

function drawLine( startPoint, endPoint ) {
	ctx.beginPath();
	ctx.moveTo( startPoint.x, startPoint.y );
	ctx.lineTo( endPoint.x, endPoint.y );
	ctx.stroke();	
}

function writeMessage( message) {
	if( typeof message == 'undefined' ) {
		message = '';
	}
	ctx.font = '15pt Helvetica';
	ctx.fillStyle = 'black';
	ctx.globalAlpha = 0.3;
	ctx.fillText( 'SFL13 ' + message, 10, CANVAS_HEIGHT - 13 );			//this needs calibrating
	ctx.globalAlpha = 1;
}
function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

//used in main.js
function updatePolygons() {
	if( mouseClick === true ) {
		var newPoint = new Point( mouseX, mouseY );
		polygons.addVertice( newPoint );
	}
	mouseClick = false;										//this could cause trouble if you ever use the mouse for anything else
	
	frontEndDrawing.clearCanvas();
	polygons.drawPolygons();					//draw the drawn in, static polygons
	frontEndDrawing.iterateRenderList();		//draw the box2d objects
	polygons.drawVertices();
	frontEndDrawing.clearRenderList();
	
	writeMessage( globalMessage );
}