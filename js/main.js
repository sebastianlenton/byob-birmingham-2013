"use strict"

/*********

written for BYOB Birmingham 2013 by Sebastian Lenton

 - perhaps:
 - alpha for polygons & bodies
 - set spawn waves - from top, from side, etc, rain or single, etc
 - set mouse scaling stuff to reset if the window resizes
 - controls for single stream waves
 - should be able to change interval of new objects
 - change new object size via keyboard
 - change attribs (bounciness, etc)
 - set walls on ind basis
 - set world gravity dynamically
 - bloom
 - starfield/background effects
 - block non-clockwise poly drawing?

 ****************/

//flags & data
var drawing_mode = false;
var current_colour = 0;

//colours
var RED = 'ff1111';
var ORANGE = 'e37b00';
var YELLOW = 'ffeb0a';
var GREEN = '2aff66';
var BLUE = '407efd';
var GREY = 'abb6ce';
var WHITE = 'ffffff';
var BLACK = '000000';

var COLORS = [ RED, ORANGE, YELLOW, GREEN, BLUE, GREY, WHITE, BLACK ];

var globalMessage = '';

var spawnRate = 150;
var SPAWN_RATE_INC = 12;

var bodiesCurrentColor = 4;								//these will all prob have to change if colours are added
var bodiesCurrentColor2 = 0;

var bodyWidth = 5;
var bodyHeight = 5;
var bodyDensity = 1;
var bodyFriction = 1;
var bodyRestitution = 1;

var polygonsCurrentColor = 2;
var polygonsCurrentAlpha = 1;
var polygonsCurrentColor2 = 4;
var polygonsCurrentAlpha2 = 1;

var backgroundCurrentColor = 3;
var feedbackAlpha = 0.4;

var floor = false;
var ceiling = false;
var leftWall = false;
var rightWall = false;

var SHAPES = [ 'square', 'circle', 'random' ];
var currentShape = 0;

var mirrorMode = false;
var displayPolygons = true;
 
var CANVAS_WIDTH = 640;
var CANVAS_HEIGHT = 480;
var bodySpawnXl = 0;
var bodySpawnXr = CANVAS_WIDTH;
var SPAWN_MOVE_INC = 10;
//this is how sensitive it is to closing the corners on drawn polygons
var CLOSE_THRESHOLD = 20;

var MOUSE_SCALE_X = document.getElementById( 'c' ).clientWidth / CANVAS_WIDTH;
var MOUSE_SCALE_Y = document.getElementById( 'c' ).clientHeight / CANVAS_HEIGHT;

var SCALE = 30;					//b2d world scale value
var WORLD_GRAVITY_X = 0;		//set this to have constant left/right gravity
var WORLD_GRAVITY_Y = 8;		//down
var DELETEBUFFER = 110;			//cull distance of objects when they leave the viewport

//intervals
var rainInterval;

var mouseX = 0;
var mouseY = 0;
var mouseClick = false;

var polygons = new Polygons();
var frontEndDrawing = new FrontEndDrawing();

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       || 
	window.webkitRequestAnimationFrame || 
	window.mozRequestAnimationFrame    || 
	window.oRequestAnimationFrame      || 
	window.msRequestAnimationFrame     || 
	function(/* function */ callback, /* DOMElement */ element){
	window.setTimeout(callback, 1000 / 60);
	};
})();

var canvas = document.getElementById("c");
var ctx = canvas.getContext("2d");
var world;

var deleteList = [];				//this is a bit poor!

canvas.addEventListener('mousemove', function( evt ) {
	var mousePos = getMousePos(canvas, evt);
	mouseX = Math.round( mousePos.x / MOUSE_SCALE_X );
	mouseY = Math.round( mousePos.y / MOUSE_SCALE_Y );
}, false);

canvas.addEventListener( 'click', function( evt ) {
	mouseClick = true;
}, false);

//keys
window.addEventListener( 'keypress', function( evt ) {
	
	//TOOLS	
	//reset - [
	if ( evt.charCode == 91 ) {
		init();
	}
	
	//undo last polygon/clear vertice buffer if drawing an unclosed polygon
	if ( evt.charCode == 112 ) {
		if( polygons.verticeBuffer.length > 0 ) {
			polygons.clearVerticeBuffer();
		} else {
			polygons.destroyLastPolygon();	
		}
	}
	
	//remove all polygons
	if ( evt.charCode == 111 ) {
		polygons.destroyAllPolygons();
	}
	
	//mirror mode
	if ( evt.charCode == 103 ) {
		if( mirrorMode == false ) {
			mirrorMode = true;
		} else {
			mirrorMode = false;
		}
	}
	
	//change shape
	if ( evt.charCode == 98 ) {
		currentShape = changeShape( currentShape );
	}
	
	//inc or dec spawn rate
	if  ( evt.charCode == 121 ) {		//down
		spawnRate -= SPAWN_RATE_INC;
		if( spawnRate < 5 ) {
			spawnRate = 5;
		}
		globalMessage = 'sp' + spawnRate;
		setRainInterval( spawnRate );
	}
	if  ( evt.charCode == 105 ) {		//up
		spawnRate += SPAWN_RATE_INC;
		globalMessage = 'sp' + spawnRate;
		setRainInterval( spawnRate );		
	}
	
	//BODY
	
	//change body1 color down	
	if( evt.charCode == 113 ) {
		bodiesCurrentColor = changeColor( bodiesCurrentColor, true );
	}
	
	//change body1 color up
	if( evt.charCode == 119 ) {
		bodiesCurrentColor = changeColor( bodiesCurrentColor );
	}
	
	//change body2 color down	
	if( evt.charCode == 101 ) {
		bodiesCurrentColor2 = changeColor( bodiesCurrentColor2, true );
	}
	
	//change body2 color up
	if( evt.charCode == 114 ) {
		bodiesCurrentColor2 = changeColor( bodiesCurrentColor2 );
	}
	
	//set bodies random colour
	if( evt.charCode == 116 ) {
		//tbi
	}
	
	//body width down
	if( evt.charCode == 110 ) {
		
		bodyWidth--;
		if( bodyWidth < 1 ) {
			bodyWidth = 1;
		}
	}
	
	//body width up
	if( evt.charCode == 109 ) {
		bodyWidth++;
	}
	
	//body height down
	if( evt.charCode == 44 ) {
		bodyHeight--;
		if( bodyHeight < 1 ) {
			bodyHeight = 1;
		}
	}
	
	//body height up
	if( evt.charCode == 46 ) {
		bodyHeight++;
	}
	
	//body friction
	if( evt.charCode == 59 ) {
		globalMessage = 'f' + bodyFriction;
		bodyFriction += 0.1;
		if( bodyFriction > 1 ) {
			bodyFriction = 1;
		}
	}
	
	//body restitution
	if( evt.charCode == 47 ) {
		globalMessage = 'r' + bodyRestitution;
		bodyRestitution += 0.1;
		if( bodyRestitution > 1 ) {
			bodyRestitution = 0;
		}
	}
	
	//spawn points
	//spawn left lower
	if( evt.charCode == 49 ) {
		bodySpawnXl-=SPAWN_MOVE_INC;
		if( bodySpawnXl < 0 ) {
			bodySpawnXl = 0;
		}
		globalMessage = 'SPl' + bodySpawnXl;
	}
	//spawn left higher
	if( evt.charCode == 50 ) {
		bodySpawnXl+=SPAWN_MOVE_INC;
		if( bodySpawnXl > bodySpawnXr ) {
			bodySpawnXl = bodySpawnXr - SPAWN_MOVE_INC;
		}
		globalMessage = 'SPl' + bodySpawnXl;
	}
	//spawn right lower
	if( evt.charCode == 51 ) {
		bodySpawnXr-=SPAWN_MOVE_INC;
		if( bodySpawnXr < bodySpawnXl ) {
			bodySpawnXr = bodySpawnXl + SPAWN_MOVE_INC;
		}
		globalMessage = 'SPr' + bodySpawnXr;
	}
	//spawn right higher
	if( evt.charCode == 52 ) {
		bodySpawnXr+=SPAWN_MOVE_INC;
		if( bodySpawnXr > CANVAS_WIDTH ) {
			bodySpawnXr = CANVAS_WIDTH;
		}
		globalMessage = 'SPr' + bodySpawnXr;
	}
	//BACKGROUND
	
	//change background color up
	if( evt.charCode == 120 ) {
		backgroundCurrentColor = changeColor( backgroundCurrentColor );
	}
	
	//change background color down
	if( evt.charCode == 122 ) {
		backgroundCurrentColor = changeColor( backgroundCurrentColor, true );
	}
	
	//change background feedback up
	if( evt.charCode == 99 ) {
		feedbackAlpha = changeZeroToOneScaleFeedback( feedbackAlpha );
	}
	
	//change background feedback down
	if( evt.charCode == 118 ) {
		feedbackAlpha = changeZeroToOneScaleFeedback( feedbackAlpha, true );
	}
	
	//POLYGONS
	
	//change polygon color up
	if( evt.charCode == 115 ) {
		polygonsCurrentColor = changeColor( polygonsCurrentColor );
	}
	
	//change polygon color down
	if( evt.charCode == 97 ) {
		polygonsCurrentColor = changeColor( polygonsCurrentColor, true );
	}
	
	//change polygon color up
	if( evt.charCode == 102 ) {
		polygonsCurrentColor2 = changeColor( polygonsCurrentColor2 );
	}
	
	//change polygon color down
	if( evt.charCode == 100 ) {
		polygonsCurrentColor2 = changeColor( polygonsCurrentColor2, true );
	}
	
	//BOUNDARIES
	//toggle floor - J
	if( evt.charCode == 106 ) {
		if( floor ) {
			deleteList.push( 'floor' );
			floor = false;
		} else {
			placeFloor();
			floor = true;
		}
	}
	
	//TBI - ceiling, walls
	
}, false );

/*********************
CONVERSIONS
*********************/

function changeColor( what, down ) {
	if( down ) {
		if( what == 0 ) {
			what = COLORS.length - 1;
		} else {
			what--;
		}
	} else if( what < COLORS.length - 1 ) {
		what++;
	} else {
		what = 0;
	}
	return what;
}

function changeShape( current ) {
	if( current < SHAPES.length - 1 ) {
		current++;
	} else {
		current = 0;
	}
	return current;
}

//this goes down to 0.01 and not 0  - rewrite this
function changeZeroToOneScaleFeedback( what, down ) {
	if( down ) {
		if( what > 0.01 ) {
			if( what < 0.15 && what > 0.01 ) {
				what = 0.01;
			} else {
				what = what - 0.1;
			}
		}
	} else if( what < 1 ) {
		if( what == 0.01 ) {
			what = 0.1;
		} else {
			what = what + 0.1;	
		}
	}
	
	if( what > 0.98 ) {
		what = 1;
	} else if( what < 0 ) {
		what = 0;
	}

	return what;
}

//rewrite this, merge with above
function changeZeroToOneScale( what, down ) {
	if( down ) {
		what = what - 0.1;
	} else {
		what = what + 0.1;
	}
	
	if( what > 1 ) {
		what = 1;
	} else if( what < 0 ) {
		what = 0;
	}
	return what;
}

function pixToUnits( value ) {
	return (value / SCALE );
}

function unitsToPix( value ) {
	return ( value * SCALE );
}

function placeFloor() {
	var myBody = createBody( ( CANVAS_WIDTH / 2 ), CANVAS_HEIGHT + 1, true );
	myBody.userData = createUserData( 'floor' );
	
	
	
	var myFixDef = createFixDefBox( CANVAS_WIDTH / 2, 1 );
	world.CreateBody(myBody).CreateFixture(myFixDef);
}

function createUserData( id ) {
	return id;
}

function createBody( x, y, isFixed ) {
	if( typeof x === 'number' ) {
		x = pixToUnits( x );
	} else {
		x = 0;
	}
	if( typeof y === 'number' ) {
		y = pixToUnits( y );
	} else {
		y = 0;
	}

	var bodyDef = new b2BodyDef;
	bodyDef.userData = createUserData( 'blank' );

	if( isFixed === true ) {
		bodyDef.type = b2Body.b2_staticBody;
	} else {
		bodyDef.type = b2Body.b2_dynamicBody;
	}
	
	bodyDef.position.x = x;
	bodyDef.position.y = y;
	
	return bodyDef;
}

function createFixDef( density, friction, restitution ) {
	var fixDef = new b2FixtureDef;
	
	if( typeof density != 'number' || density < 0 ) {
		density = 0;
	} else if( density > 1 ) {
		density = 1;
	}
	if( typeof friction != 'number' || friction < 0 ) {
		friction = 0;
	} else if( friction > 1 ) {
		friction = 1;
	}
	if( typeof restitution != 'number' || restitution < 0 ) {
		restitution = 0;
	} else if( restitution > 1 ) {
		restitution = 1;
	}
	
	fixDef.density = density;
	fixDef.friction = friction;
	fixDef.restitution = restitution;
	
	return fixDef;
}

function createFixDefBox( width, height, fixDefIn ) {
	width = pixToUnits( width );
	height = pixToUnits( height );
	
	var fixDef;
	
	if( typeof fixDefIn != 'undefined' ) {
		fixDef = fixDefIn;
	} else {
		fixDef = new createFixDef();
	}
	
	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsBox( width, height );
	
	return fixDef;
}

function createFixdefPolygon( points, fixDefIn ) {				//this could be merged in
	var fixDef;
	
	for (var i = 0; i < points.length; i++) {
	    var vec = new b2Vec2();
	    vec.Set(points[i].x, points[i].y);
	    points[i] = vec;
	}
	
	if( typeof fixDefIn != 'undefined' ) {
		fixDef = fixDefIn;
	} else {
		fixDef = new createFixDef();
	}
	
	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsArray(points, points.length);	
	
	return fixDef;
}

function createFixdefCircle( radius, fixDefIn ) {				//this could be merged in
	radius = pixToUnits( radius * 2 );
	var fixDef;
	
	if( typeof fixDefIn != 'undefined' ) {
		fixDef = fixDefIn;
	} else {
		fixDef = new createFixDef();
	}
	
	fixDef.shape = new b2CircleShape( radius );
	
	return fixDef;
}

/*********************
TEST
*********************/

function doRain() {
	var fixDef = createFixDef( bodyDensity, bodyFriction, bodyRestitution );
	
	var bodyDef = createBody( ( Math.random() * ( bodySpawnXr - bodySpawnXl ) ) + bodySpawnXl, -50 );
	
	if( SHAPES[ currentShape ] == 'square' ) {
		fixDef = createFixDefBox( bodyWidth, bodyHeight, fixDef );
	} else if( SHAPES[ currentShape ] == 'circle' ) {
		fixDef = createFixdefCircle( bodyWidth / 2, fixDef );
	} else if( SHAPES[ currentShape ] == 'random' ) {
		var random = Math.round( Math.random() );
		if( random == 1 ) {
			fixDef = createFixDefBox( bodyWidth, bodyHeight, fixDef );
		} else {
			fixDef = createFixdefCircle( bodyWidth / 2, fixDef );
		}
	}
	
	world.CreateBody(bodyDef).CreateFixture(fixDef);
}

function setRainInterval( toWhat ) {
	clearInterval( rainInterval );	rainInterval = setInterval( doRain, toWhat );
}

/*********************
END TEST
*********************/

function init() {
	polygons.reset();
	world = new b2World(
		new b2Vec2( WORLD_GRAVITY_X, WORLD_GRAVITY_Y )    //gravity
		,  true                 //allow sleep
	);
	
	if( floor ) {
		placeFloor();
	}

	setRainInterval( spawnRate );
	
	world.SetDebugDraw( getDebugDraw() );
};

function getBodyCount() {
	var node = world.GetBodyList();
	var counter = 0;
	while ( node ) {
		node = node.GetNext();
		counter++;
	}

	return counter;
}

function processObjects() {
	var node = world.GetBodyList();
	while ( node ) {
		var b = node;
		node = node.GetNext();
		
		for( var w = deleteList.length; w >= 0; w-- ) {
			if( b.m_userData == deleteList[ w ] ) {
				world.DestroyBody(b);
			}
		}
		
		var position = b.GetPosition();
		var pxPosX = unitsToPix( position.x );
		var pxPosY = unitsToPix( position.y );
		
		if ( pxPosX < -DELETEBUFFER || pxPosX > ( CANVAS_WIDTH + DELETEBUFFER ) ) {
			world.DestroyBody(b);
		} else if( pxPosY < -DELETEBUFFER || pxPosY > ( CANVAS_HEIGHT + DELETEBUFFER ) ) {
			world.DestroyBody(b);
		}
		
		if (b.GetType() == b2Body.b2_dynamicBody) {
			var fl = b.GetFixtureList();
			if (!fl) {
				continue;
			}
			
			var shape = fl.GetShape();
			var shapeType = shape.GetType();
			
			if (shapeType == b2Shape.e_circleShape) {
				var radius = unitsToPix( shape.GetRadius() );
				var newCircle = new ShapeDataType( 'circle', radius, new Point( unitsToPix( position.x ), unitsToPix( position.y ) ) );
				frontEndDrawing.addToRenderList( newCircle );
			} else if ( shapeType == b2Shape.e_polygonShape ) {
				var vert = shape.GetVertices();
				var points = [];
				b2Math.MulMV(b.m_xf.R,vert[0]);
				var tV = b2Math.AddVV(position, b2Math.MulMV(b.m_xf.R, vert[0]));
				points.push( new Point( unitsToPix(tV.x), unitsToPix(tV.y) ) );

				for (var i = 0; i < vert.length; i++) {
					var v = b2Math.AddVV(position, b2Math.MulMV(b.m_xf.R, vert[i]));
					points.push( new Point( unitsToPix(v.x), unitsToPix(v.y) ) );
				}
				points.push( new Point( unitsToPix(tV.x), unitsToPix(tV.y) ) );
				
				var newPolygon = new ShapeDataType( 'polygon', points );
				frontEndDrawing.addToRenderList( newPolygon );
			}
		}
	}
	deleteList = [];
}

function getDebugDraw() {
	var debugDraw = new b2DebugDraw();
	debugDraw.SetSprite(ctx);
	debugDraw.SetDrawScale(SCALE);
	debugDraw.SetFillAlpha(0.3);
	debugDraw.SetLineThickness(1.0);
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
	
	return debugDraw;
}

function update() {

	world.Step(
		1 / 60   //frame-rate
		,  8       //velocity iterations
		,  8       //position iterations
	);
	//world.DrawDebugData();																//if you want to turn on b3D's own debug drawing to check (will be upsode down)
	processObjects();
	updatePolygons();
	world.ClearForces();
	
	requestAnimFrame(update);
};

init();
requestAnimFrame(update);
