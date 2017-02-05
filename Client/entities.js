/*
	ENTITY OBJECTS
	
	This file contains all entity object prototypes
*/

//Player
var spritePlayer = new Sprite('player.png', 2.0, 2.0, new Vector2(-1.0, 1.7));

function Player(x, y)
{
	// generic network things
	this.netId = 0;
	this.ownedByPlayer = false;
	
	// player specific network things
	this.serverPos = tileToWorld(x, y);
	this.serverFaceDir = 0;
	this.serverTargetTile = worldToTile(x, y);
	
	//generic things
	this.pos = tileToWorld(x, y); //new Vector2(x, y);
	this.visible = true;
	this.sprite = spritePlayer;
	this.col = new BoxCollider(new Vector2(0, 0), new Vector2(0.9, 0.9));
	this.enabled = false;
	
	//player specific things
	this.sprite.z = 1;
	this.faceDir = 0;					//up, left, down, right --> 0, 1, 2, 3
	this.currentTile = worldToTile(x, y);
	this.targetTile = worldToTile(x, y);
	this.allowButtonKeepDown = false;
	this.isMoving = false;
	this.moveAnimTimer = 0;
	this.moveAnimState = 0;
	
	this.stepSound = new AudioPlayer('resources/step.ogg', AudioType.environment, false, 1.0);
}

Player.prototype.update = function(deltaTime)
{	
	if(!this.ownedByPlayer)
	{
		if(v2Difference(this.pos, this.serverPos) > 1)
		{
			this.pos = this.serverPos;
		}
		this.targetTile = this.serverTargetTile;
		this.faceDir = this.serverFaceDir;
	}
	
	this.currentTile = worldToTile(this.pos.x, this.pos.y);
	var targetPos = tileToWorld(this.targetTile.x, this.targetTile.y);
	
	if(v2Difference(this.pos, targetPos) < 0.1)
	{
		if(this.ownedByPlayer)
		{
			//If we are moving we want to be able to keep moving, so in that case we check if the button is down.
			//Otherwise, check if a button was just pressed. This way we can stop the player from moving when entering portals.
			if((buttons[ButtonIndex.left].isDown && this.allowButtonKeepDown) || (buttons[ButtonIndex.left].wasPressed() && !this.allowButtonKeepDown))
			{
				this.targetTile = v2Add(this.currentTile, new Vector2(-1, 0));
				this.faceDir = 1;
				this.allowButtonKeepDown = true;
			}
			if((buttons[ButtonIndex.right].isDown && this.allowButtonKeepDown) || (buttons[ButtonIndex.right].wasPressed() && !this.allowButtonKeepDown))
			{
				this.targetTile = v2Add(this.currentTile, new Vector2(1, 0));
				this.faceDir = 3;
				this.allowButtonKeepDown = true;
			}
			if((buttons[ButtonIndex.up].isDown && this.allowButtonKeepDown) || (buttons[ButtonIndex.up].wasPressed() && !this.allowButtonKeepDown))
			{
				this.targetTile = v2Add(this.currentTile, new Vector2(0, 1));
				this.faceDir = 0;
				this.allowButtonKeepDown = true;
			}
			if((buttons[ButtonIndex.down].isDown && this.allowButtonKeepDown) || (buttons[ButtonIndex.down].wasPressed() && !this.allowButtonKeepDown))
			{
				this.targetTile = v2Add(this.currentTile, new Vector2(0, -1));
				this.faceDir = 2;
				this.allowButtonKeepDown = true;
			}
		}
	}
	
	//See if the target tile is walkable
	var tv = getTile(this.targetTile.x, this.targetTile.y);
	if(!tv.walkable){
		this.targetTile.x = this.currentTile.x;
		this.targetTile.y = this.currentTile.y;
	}
	
	//Move to the target tile
	targetPos = tileToWorld(this.targetTile.x, this.targetTile.y);
	if(v2Difference(this.pos, targetPos) > 0.1)
	{
		var deltaPos = v2Subtract(targetPos, this.pos);
		deltaPos = v2SetLength(deltaPos, 5);	//wut?
		this.pos = v2Add(this.pos, v2Multiply(deltaPos, deltaTime));	
		this.isMoving = true;
	}
	else
	{
		var d = worldToTile(this.pos.x, this.pos.y);
		this.pos = tileToWorld(d.x, d.y);
		//this.pos.x = Math.round(this.pos.x);
		//this.pos.y = Math.round(this.pos.y);
		this.isMoving = false;
	}
	
	//Animation code
	if(this.isMoving)
	{
		if(this.moveAnimTimer > 15 * (targetFrameRate / 60))
		{
			this.moveAnimState = (this.moveAnimState == 2) ? 1 : 2;
			this.moveAnimTimer = 0;
			
			this.stepSound.stop();
			this.stepSound.play();
		}
		this.moveAnimTimer++;
	}
	else
	{
		this.moveAnimState = 0;
		this.moveAnimTimer = 99;
	}
	
	//Other functions
};

Player.prototype.render = function()
{
	var srcx = 32 * this.moveAnimState;
	var srcy = 32 * this.faceDir;
	var srcw = 32;
	var srch = 32;
	drawWorldImageSheet(this.pos.x + this.sprite.offset.x, this.pos.y + this.sprite.offset.y,
				this.sprite.width, this.sprite.height,
				this.sprite.image,
				srcx, srcy, srcw, srch);
				
				//debug
	drawWorldRectOutline(this.pos.x + this.col.left, this.pos.y + this.col.top, this.col.size.x, this.col.size.y, '#FFFF00');
};

Player.prototype.disable = function()
{
	this.enabled = false;
};

Player.prototype.enable = function()
{
	this.enabled = true;
};

// Gets the state object that should be send to the server for this object
Player.prototype.getNetworkMessage = function ()
{
	var values = [];
	
	values.push({
		Key: "serverPos",
		Value: this.pos
	});
	values.push({
		Key: "serverFaceDir",
		Value: this.faceDir
	});
	values.push({
		Key: "serverTargetTile",
		Value: this.targetTile
	});
	
	
	var msg = {
		entityId: writeNetId(this.netId),
		values: values
	};
	
	return msg;
};

Player.prototype.teleport = function(newWorldPos)
{
	//Set position
	var d = worldToTile(newWorldPos.x, newWorldPos.y);
	this.pos = tileToWorld(d.x, d.y);
	console.log('Teleporting player to ' + this.pos.x + ' ' + this.pos.y);
	//Not moving
	this.isMoving = false;
	//Require move buttons to be pressed again
	this.allowButtonKeepDown = false;
	//Make sure we don't want to move next frame
	this.currentTile = worldToTile(this.pos.x, this.pos.y);
	this.targetTile.x = this.currentTile.x;
	this.targetTile.y = this.currentTile.y;
	//Reset walking animtion
	this.moveAnimState = 0;
	this.moveAnimTimer = 99;
};



//Train
var spriteTrain = new Sprite('train_64.png', 44.296875, 3.5, new Vector2(-22.1484375, 3.7));

function Train(x, y, vx, vy)
{
	this.pos = tileToWorld(x, y);
	this.vel = new Vector2(vx, vy);
	this.visible = true;
	this.sprite = spriteTrain;
	this.col = new BoxCollider(new Vector2(0, 1), new Vector2(44.296875, 1.8));
	this.enabled = false;
	
	this.colbool = false;
	this.engineSound = new AudioPlayer('resources/train.mp3', AudioType.environment, true, 1.0);
}

Train.prototype.update = function(deltaTime)
{
	this.vel.x = -10;

	this.pos = v2Add(this.pos, v2Multiply(this.vel, deltaTime));
	if(this.pos.x < -60){
		this.pos.x = 200;
	}
	
	//shitty volume control
	var pdistance = v2Difference(this.pos, player.pos);
	this.engineSound.setVolume(10.0 / pdistance);
	if(pdistance > 50)
		this.engineSound.setVolume(0);
	
	if(checkCollision(this, player))
	{
		if(!this.colbool)
		{
			if(player.faceDir == 0)
				player.targetTile.y -= 1;
			else
				player.targetTile.y += 1;
			this.colbool = true;
		}
		
	}
	else
	{
		this.colbool = false;
	}
};

Train.prototype.render = function()
{
	drawWorldImage(this.pos.x + this.sprite.offset.x, this.pos.y + this.sprite.offset.y,
				this.sprite.width, this.sprite.height,
				this.sprite.image);
	
	drawWorldRectOutline(this.pos.x + this.col.left, this.pos.y + this.col.top, this.col.size.x, this.col.size.y, '#FFFF00');
};

Train.prototype.disable = function()
{
	this.enabled = false;
	this.engineSound.pause();
};

Train.prototype.enable = function()
{
	this.enabled = true;
	this.engineSound.play();
};





//Tree
var spriteTree = new Sprite('tree.png', 2, 2.65625, new Vector2(-1, 1.9));

function Tree(x, y)
{
	this.pos = tileToWorld(x, y);
	this.visible = true;
	this.sprite = spriteTree;
	this.enabled = false;
}

Tree.prototype.update = function(deltaTime)
{
};

Tree.prototype.render = function()
{
	drawWorldImage(this.pos.x + this.sprite.offset.x, this.pos.y + this.sprite.offset.y,
				this.sprite.width, this.sprite.height,
				this.sprite.image);
};

Tree.prototype.disable = function()
{
	this.enabled = false;
};

Tree.prototype.enable = function()
{
	this.enabled = true;
};





//Dialog Window	
var TypeState = {
	typing: 1,
	paused: 2,
	finished: 3
};

var spriteDialogWindow = new Sprite('tree.png', 2, 2.65625, new Vector2(-1, 1.9));

function DialogWindow(startEnabled)
{
	this.text = "This is a new dialog window!	This should be after a pause!";		//Text to display
	this.typeRate = 30;								//Characters per second
	this.typeState = TypeState.typing;				//Our current state
	this.enabled = startEnabled;
	this.visible = startEnabled;
	if(startEnabled)
	{
		player.enabled = false;
	}
	this.typeTimer = 0;								//Timer in seconds
	this.sprite = spriteDialogWindow;
	this.sprite.z = 1000000000;						//I wanna be the very best
	this.pos = new Vector2(0, 0);
	
	this.nextTextIndex = 0;							//Next index to add
	this.visibleText = "";							//Text that is visible
}

DialogWindow.prototype.update = function(deltaTime)
{
	if(this.typeState == TypeState.typing)
	{
		var secondsPerChar = 1 / this.typeRate;
		if(this.typeTimer >= secondsPerChar)
		{
			//Tabs are used to denote a pause
			if(this.text.charCodeAt(this.nextTextIndex) == 9)
			{
				this.typeState = TypeState.paused;
				this.nextTextIndex++;
				this.typeTimer = 0;
			}
			else
			{
				this.visibleText += this.text[this.nextTextIndex];
				this.nextTextIndex++;
				this.typeTimer = 0;
				if(this.nextTextIndex >= this.text.length)
				{
					this.typeState = TypeState.finished;
				}
			}
		}
		this.typeTimer += deltaTime;
		
		if(buttons[ButtonIndex.right].wasReleased())
		{
			var hitPause = false;
			while(!hitPause)
			{
				if(this.text.charCodeAt(this.nextTextIndex) != 9)
				{
					this.visibleText += this.text[this.nextTextIndex];
					this.nextTextIndex++;
					if(this.nextTextIndex >= this.text.length)
					{
						this.typeState = TypeState.finished;
						return;
					}
				}
				else
				{
					this.nextTextIndex++;
					hitPause = true;
				}
			}
			this.typeTimer = 0;
			this.typeState = TypeState.paused;
		}
	}
	else if(this.typeState == TypeState.paused)
	{
		if(buttons[ButtonIndex.right].wasReleased())
		{
			//meh
			this.visibleText = "";
			this.typeState = TypeState.typing;
		}
	}
	else if(this.typeState == TypeState.finished)
	{
		if(buttons[ButtonIndex.right].wasReleased())
		{
			this.close();
		}
	}
};

DialogWindow.prototype.show = function(text)
{
	this.enabled = true;
	this.visible = true;
	this.text = text;
	this.visibleText = "";
	this.typeTimer = 0;
	this.typeState = TypeState.typing;
	this.nextTextIndex = 0;
	
	//Disable player movement
	player.enabled = false;
};

DialogWindow.prototype.close = function()
{
	this.enabled = false;
	this.visible = false;
	this.text = "";
	
	//Enable player movement
	player.enabled = true;
};

DialogWindow.prototype.render = function()
{
	drawScreenRect(10, display.height - 230, display.width - 20, 220, '#FFFFFF');
	renderContext.fillStyle = '#000000';
	renderContext.font = '18px Arial';
	renderContext.fillText(this.visibleText, 20, display.height - 210);
};

DialogWindow.prototype.disable = function()
{
	this.enabled = false;
};

DialogWindow.prototype.enable = function()
{
	this.enabled = true;
};





//Portal
//TODO: Make constructor consistent with others?
function Portal(tilePos, targetLevel, targetTilePos)
{
	this.pos = tileToWorld(tilePos.x, tilePos.y);
	this.targetPos = tileToWorld(targetTilePos.x, targetTilePos.y);
	this.targetLevel = targetLevel;
	this.sprite = spriteDialogWindow;
	
	this.visible = true;
	this.col = new BoxCollider(new Vector2(0, 0), new Vector2(0.9, 0.9));
	this.enabled = false;
}

Portal.prototype.update = function(deltaTime)
{
	if(checkCollision(player, this) && !player.isMoving)
	{
		changeCurrentLevel(this.targetLevel);
		player.teleport(this.targetPos);
		//dialogWindow.show("You have entered a new area!");
	}
};

Portal.prototype.render = function()
{
	drawWorldRectOutline(this.pos.x + this.col.left, this.pos.y + this.col.top, this.col.size.x, this.col.size.y, '#FF0000');
};

Portal.prototype.disable = function()
{
	this.enabled = false;
};

Portal.prototype.enable = function()
{
	this.enabled = true;
};


//Trashcan
var spriteTrashcan = new Sprite('trashcan.png', 1, 1, new Vector2(-0.5, 0.7));
function Trashcan(x, y)
{
	this.pos = tileToWorld(x, y);
	this.sprite = spriteTrashcan;
	
	this.visible = true;
	this.col = new BoxCollider(new Vector2(0, 0), new Vector2(2.9, 2.9));
	this.enabled = false;
	
	//ambient music via trashcan
	this.music = new AudioPlayer('resources/music-01.mp3', AudioType.music, true, 1);
}

Trashcan.prototype.update = function(deltaTime)
{
	/*if(checkCollision(player, this) && !player.isMoving)
	{
		changeCurrentLevel(this.targetLevel);
		player.teleport(this.targetPos);
		//dialogWindow.show("You have entered a new area!");
	}*/
	//console.log("I'ma trash can");
};

Trashcan.prototype.render = function()
{
	drawWorldImage(this.pos.x + this.sprite.offset.x, this.pos.y + this.sprite.offset.y,
				this.sprite.width, this.sprite.height,
				this.sprite.image);
	drawWorldRectOutline(this.pos.x + this.col.left, this.pos.y + this.col.top, this.col.size.x, this.col.size.y, '#FFFF00');
};

Trashcan.prototype.disable = function()
{
	this.enabled = false;
	this.music.pause();
};

Trashcan.prototype.enable = function()
{
	this.enabled = true;
	this.music.play();
};