/*
	STUFF
*/

var GameMode = {
	game: 0,
	editor: 1
};

var gameMode = GameMode.game;

/*
	NETWORKING
*/

function Net(webSocketUrl)
{
	this.ready = false;
	this.ws = new WebSocket(webSocketUrl);
	this.ws.onopen = function()
	{
		net.ready = true;
		net.onopen();
	};
	
	this.ws.onclose = function()
	{
		console.log("Connection is closed..."); 
		net.onclose();
	};
	
	this.ws.onmessage = function (evt) 
	{ 
		var string = evt.data;
		//console.log("Message is received:\n" + string);
		try 
		{
			var obj = JSON.parse(string);
			net.onmessage(obj);
		}
		catch(err)
		{
			console.log("Error parsing message as JSON: \n" + err);
		}
	};
	
	// Used for game launch
	this.onopen = function()
	{
		
	};
	
	// Assign message handling function to this in game.js
	this.onmessage = function(obj)
	{
		
	};
	
	// When closed
	this.onclose = function()
	{
		
	};
	
	this.netcollection = new NetCollection();
}

Net.prototype.sendJSON = function(msg)
{
	if(this.ready)
	{
		this.ws.send(JSON.stringify(msg));
	}
};

var net = new Net("ws://localhost:9998/echo");
var NET_SPEED_COMP_FACTOR = 0.92;

function NetCollection()
{
	this.list = [];
	this.dictionary = {};
}

NetCollection.prototype.entityRegister = function(entity)
{
	this.dictionary[entity.netId] = entity;
	this.list.push(entity);
};

NetCollection.prototype.entityFind = function(netId)
{
	return this.dictionary[netId];
};

NetCollection.prototype.entityRemove = function(netId)
{
	if(this.dictionary[netId])
	{
		var ent = this.dictionary[netId];
		this.dictionary[netId] = null;
		var index = this.list.indexOf(ent);
		if(index > -1)
		{
			this.list.splice(index, 1);
		}
		else
		{
			console.log("NC: Missing entity in list when removing?!");
		}
		return true;
	}
	return false;
};

function readNetId(id)
{
	return "I" + id;
}

function writeNetId(id)
{
	return parseInt(id.substr(1));
}

/*
	INPUT
*/

var KeyCode = {
	up: 38,
	down: 40,
	left: 37,
	right: 39
};

var ButtonIndex = {
	up: 0,
	down: 1,
	left: 2,
	right: 3,
	mouse0: 4,
	mouse1: 5,
	mouse2: 6
};

function Button()
{
	this.isDown = false;
	this.wasDown = false;
	this.wasPressed = function(){ return (this.isDown && !this.wasDown) };
	this.wasReleased = function(){ return (!this.isDown && this.wasDown) };
}

var buttons = [
	new Button(),	//up
	new Button(),	//down
	new Button(),	//left
	new Button(),	//right
	new Button(),	//mouse0
	new Button(),	//mouse1
	new Button()	//mouse2
];

var mouse = {
	x: 0,
	y: 0
};		//Mouse position relative to display


/*
	LEVELS AND TILES
*/

function Tile(walkable, image)
{
	this.walkable = walkable;
	this.image = image;
}

var TileType = {
	grass: new Tile(true, loadImage('resources/grass.png')),
	wall: new Tile(false, loadImage('resources/wall.png')),
	tracks: new Tile(true, loadImage('resources/tracks.png')),
	tracksCrossing: new Tile(true, loadImage('resources/tracks_crossing.png')),
	sand: new Tile(true, loadImage('resources/sand.png'))
};


//var viewport.pixelsPerUnit = 32.0;
const TILE_SIZE = 1.0;


function Level(name, tiles, tileCountX, tileCountY)
{
	this.name = name;
	this.tiles = tiles;
	this.tileCountX = tileCountX;
	this.tileCountY = tileCountY;
	this.entities = [];
}

Level.prototype.entityRegister = function(entity)
{
	this.entities.push(entity);
};

Level.prototype.entityRemove = function(entity)
{
	var index = this.entities.indexOf(entity);
	if(index > -1)
	{
		this.entities.splice(index, 1);
		return true;
	}
	return false;
};

Level.prototype.getTile = function(x, y)
{
	x = Math.floor(x);
	y = Math.floor(y);
	var val = this.tiles[y * this.tileCountX + x];
	return val;
}

Level.prototype.getTileFromWorld = function(x, y)
{
	x = Math.floor(x / TILE_SIZE);
	y = Math.floor(y / TILE_SIZE);
	var val = this.tiles[y * this.tileCountX + x];
	return val;
}

var levels = [];

var currentLevelIndex = 0;
var currentLevel = null;

function initFirstLevel()
{
	currentLevelIndex = 0;
	currentLevel = levels[currentLevelIndex];
	//Enable entities
	for(var i = 0; i < currentLevel.entities.length; i++)
	{
		currentLevel.entities[i].enable();
	}
}

function changeCurrentLevel(newLevelIndex)
{
	if(newLevelIndex >= 0 && newLevelIndex < levels.length)
	{
		//Disable old entities
		for(var i = 0; i < currentLevel.entities.length; i++)
		{
			currentLevel.entities[i].disable();
		}
		//Change the current level
		currentLevelIndex = newLevelIndex;
		currentLevel = levels[currentLevelIndex];
		//Enable new entities
		for(var i = 0; i < currentLevel.entities.length; i++)
		{
			currentLevel.entities[i].enable();
		}
	}
}

/*
	RENDERING
*/

var display;		//display canvas
var buffer;			//back buffer
var renderContext;	//back buffer render context
var intervalId;
var targetFrameRate = 60;
var targetFrameTime = 1000 /targetFrameRate;
var prevTime = 0;

var viewport = {
	pos: new Vector2(0, 0),
	size: new Vector2(0, 0),
	pixelsPerUnit: 32,
	target: null,
	calcSize: function()
	{
		this.size.x = buffer.width / this.pixelsPerUnit;
		this.size.y = buffer.height / this.pixelsPerUnit;
	},
	setDrawScale: function(newPPU)
	{
		this.pixelsPerUnit = newPPU;
		this.calcSize();
	}
};


/*
	AUDIO
*/

var AudioType = {
	main: 0,
	music: 1,
	environment: 2
};

var AudioVolumes = [
	1.0,
	1.0,
	1.0
];

function setAudioVolume(audioType, volume)
{
	volume = clamp(volume, 0, 1);
	AudioVolumes[audioType] = volume;
	for(var i = 0; i < audioPlayers.length; i++)
	{
		audioPlayers[i].setVolume(audioPlayers[i].volume);
	}
}

var audioPlayers = [];

function audioRegister(obj)
{
	audioPlayers.push(obj);
}

function AudioPlayer(src, audioType, looping, volume)
{
	this.audio = new Audio(src);
	this.audio.loop = looping;
	this.type = audioType;
	this.volume = 1;
	this.setVolume(volume);
	audioRegister(this);
}

AudioPlayer.prototype.play = function()
{
	this.audio.play();
};

AudioPlayer.prototype.pause = function()
{
	this.audio.pause();
};

AudioPlayer.prototype.stop = function()
{
	this.audio.pause();
	this.audio.currentTime = 0;
};

AudioPlayer.prototype.setVolume = function(newVolume)
{
	this.volume = clamp(newVolume, 0, 1);
	this.audio.volume = this.volume * AudioVolumes[0] * AudioVolumes[this.type];
};

/*
	GAME OBJECT STUFF
*/

//Sprite
function Sprite(src, width, height, offset)
{
	this.image = loadImage('resources/' + src);
	this.width = width;
	this.height = height;
	this.offset = offset;
	this.z = 0;
}

//Box Collider
function BoxCollider(center, size)
{
	this.center = center;
	this.size = size;
	
	this.left = center.x - size.x * 0.5;
	this.right = center.x + size.x * 0.5;
	this.top = center.y + size.y * 0.5;
	this.bottom = center.y - size.y * 0.5;
}

/*
	OBJECT POOLING AND globalEntities
*/

var entityPools = [];

function createEntityPool(factory, count, level)
{
	var pool = [];
	for(var i = 0; i < count; i++)
	{
		var obj = new factory();
		obj.visible = false;
		pool.push(obj);
		if(level < 0){
			entityRegister(obj);
		}else{
			levels[level].entityRegister(obj);
		}
		
	}
	return (entityPools.push(pool) - 1);
}

function requestFromPool(poolIndex)
{
	if(poolIndex < entityPools.length)
	{
		for(var i = 0; i < entityPools[poolIndex].length; i++)
		{
			if(entityPools[poolIndex][i].visible == false)
			{
				return entityPools[poolIndex][i];
			}
		}
		//If we can't find any, return the first
		return entityPools[poolIndex][0];
	}
	return null;
}

//Adds an entity to the global entity list and sorts it
var globalEntities = [];
function entityRegister(object)
{
	globalEntities.push(object);
	globalEntities.sort(function(a, b){
		return a.sprite.z - b.sprite.z;
	});
}



/*
	FUNCTIONS
*/
/*
	Utility
*/
function clamp(val, min, max)
{
	if(val > max)
		return max;
	if(val < min)
		return min;
	return val;
}

function loadImage(src)
{
	var tmp = document.createElement('img');
	tmp.src = src;
	return tmp;
}

var currentDir = document.location.href.substring(0, document.location.href.lastIndexOf("/")) + "/"

function loadTextFile(src)
{
	var tmp = new XMLHttpRequest();
	console.log(currentDir + src );
	tmp.addEventListener('load', loadTextFileListener);
	tmp.open("post", currentDir + src, true);
	tmp.send();
}

function loadTextFileListener()
{
	console.log(this.responseText);
}

//loadTextFile("levels/level0.txt");

/*
	Collision
*/

function checkCollision(entA, entB)
{
	var aLeft = entA.pos.x + entA.col.left;
	var aRight = entA.pos.x + entA.col.right;
	var aTop = entA.pos.y + entA.col.top;
	var aBot = entA.pos.y + entA.col.bottom;
	
	var bLeft = entB.pos.x + entB.col.left;
	var bRight = entB.pos.x + entB.col.right;
	var bTop = entB.pos.y + entB.col.top;
	var bBot = entB.pos.y + entB.col.bottom;
	
	if(aRight < bLeft || aLeft > bRight || aTop < bBot || aBot > bTop)
	{
		return false;
	}
	return true;
}

/*
	Render functions
*/
function drawScreenRect(x, y, width, height, fillStyle)
{
	//renderContext.beginPath();
	renderContext.fillStyle = fillStyle;
	renderContext.fillRect(x, y, width, height);
	//renderContext.closePath();
}

function drawWorldRect(x, y, width, height, fillStyle)
{
	x -= viewport.pos.x;
	y -= viewport.pos.y;
	//renderContext.beginPath();
	renderContext.fillStyle = fillStyle;
	renderContext.fillRect(Math.floor(x * viewport.pixelsPerUnit), Math.floor(buffer.height - (y * viewport.pixelsPerUnit)),
		width * viewport.pixelsPerUnit, height * viewport.pixelsPerUnit);
	//renderContext.closePath();
}

function drawWorldRectOutline(x, y, width, height, strokeStyle)
{
	x -= viewport.pos.x;
	y -= viewport.pos.y;
	//renderContext.beginPath();
	renderContext.strokeStyle = strokeStyle;
	renderContext.strokeRect(Math.floor(x * viewport.pixelsPerUnit), Math.floor(buffer.height - (y * viewport.pixelsPerUnit)),
		width * viewport.pixelsPerUnit, height * viewport.pixelsPerUnit);
	//renderContext.closePath();
}

function drawWorldImage(x, y, width, height, image)
{
	x -= viewport.pos.x;
	y -= viewport.pos.y;
	renderContext.drawImage(image,
		Math.round((x * viewport.pixelsPerUnit)), (buffer.height - Math.round((y * viewport.pixelsPerUnit))),
		width * viewport.pixelsPerUnit, height * viewport.pixelsPerUnit);
}

function fillWorldText(x, y, text, font, color)
{
	x -= viewport.pos.x;
	y -= viewport.pos.y;
	renderContext.fillStyle = color;
	renderContext.font = font;
	renderContext.fillText(text,
		Math.round((x * viewport.pixelsPerUnit)), (buffer.height - Math.round((y * viewport.pixelsPerUnit))));
}

function drawWorldImageSheet(x, y, width, height, image, srcx, srcy, srcw, srch)
{
	x -= viewport.pos.x;
	y -= viewport.pos.y;
	renderContext.drawImage(image,
		srcx, srcy, srcw, srch,
		Math.round((x * viewport.pixelsPerUnit)), (buffer.height - Math.round((y * viewport.pixelsPerUnit))),
		width * viewport.pixelsPerUnit, height * viewport.pixelsPerUnit);
}

function drawTile(x, y, fillStyle)
{
	drawWorldImage(x * TILE_SIZE, TILE_SIZE + y * TILE_SIZE, TILE_SIZE, TILE_SIZE, currentLevel.tiles[y * currentLevel.tileCountX + x].image);
}

function screenFlip()
{
	var dc = display.getContext('2d');
	dc.drawImage(buffer, 0, 0);
}

/*
	Tile functions
*/

function worldToTile(x, y)
{
	x = Math.floor(x / TILE_SIZE);
	y = Math.floor(y / TILE_SIZE);
	return new Vector2(x, y);
}

function tileToWorld(x, y)
{
	x = x * TILE_SIZE + 0.5 * TILE_SIZE;
	y = y * TILE_SIZE + 0.5 * TILE_SIZE;
	return new Vector2(x, y);
}

/*
	Input functions
*/
function mouseToWorld()
{
	var world = {
		x: mouse.x,
		y: display.height - mouse.y
	};
	world.x /= viewport.pixelsPerUnit;
	world.y /= viewport.pixelsPerUnit;
	world.x += viewport.pos.x;
	world.y += viewport.pos.y;
	return world;
}

function mouseMoveHandler(event)
{
	var crect = display.getBoundingClientRect();
	mouse.x = clamp(event.clientX - crect.left, 0, display.width);
	mouse.y = clamp(event.clientY - crect.top, 0, display.height);
}

function mousePressedHandler(event)
{
	if(event.button == 0)
	{
		buttons[ButtonIndex.mouse0].isDown = true;
	}
	if(event.button == 2)
	{
		buttons[ButtonIndex.mouse1].isDown = true;
	}
	if(event.button == 1)
	{
		buttons[ButtonIndex.mouse2].isDown = true;
	}
}

function mouseReleasedHandler(event)
{
	if(event.button == 0)
	{
		buttons[ButtonIndex.mouse0].isDown = false;
	}
	if(event.button == 2)
	{
		buttons[ButtonIndex.mouse1].isDown = false;
	}
	if(event.button == 1)
	{
		buttons[ButtonIndex.mouse2].isDown = false;
	}
}

function keyboardPressedHandler(event)
{
	if(event.keyCode == KeyCode.left)
	{
		buttons[ButtonIndex.left].isDown = true;
	}
	if(event.keyCode == KeyCode.right)
	{
		buttons[ButtonIndex.right].isDown = true;
	}
	if(event.keyCode == KeyCode.up)
	{
		buttons[ButtonIndex.up].isDown = true;
	}
	if(event.keyCode == KeyCode.down)
	{
		buttons[ButtonIndex.down].isDown = true;
	}
}

function keyboardReleasedHandler(event)
{
	if(event.keyCode == KeyCode.left)
	{
		buttons[ButtonIndex.left].isDown = false;
	}
	if(event.keyCode == KeyCode.right)
	{
		buttons[ButtonIndex.right].isDown = false;
	}
	if(event.keyCode == KeyCode.up)
	{
		buttons[ButtonIndex.up].isDown = false;
	}
	if(event.keyCode == KeyCode.down)
	{
		buttons[ButtonIndex.down].isDown = false;
	}
}