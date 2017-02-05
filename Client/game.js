//Very important!
window.onload = gameStart;


/*

	ADD GLOBAL ENTITIES HERE
	Note: newly created entity objects need to be 'registered' before they will work.
	You can do this by using entityRegister(object) to register it as a global entity, or
	by calling the entityRegister(object) method on a Level object e.g. currentLevel.entityRegister(object)
	
*/
var player = new Player(4, 4);
entityRegister(player);

var dialogWindow = new DialogWindow(false);
entityRegister(dialogWindow);

var audioMusic = new AudioPlayer('resources/music-01.mp3', AudioType.music, true, 1.0);
//audioMusic.play();
/*

	GAME FUNCTIONS

*/
function gameStart()
{
	//Add input event listeners
	document.addEventListener('keydown', keyboardPressedHandler);
	document.addEventListener('keyup', keyboardReleasedHandler);
	document.addEventListener('mousemove', mouseMoveHandler);
	document.addEventListener('mousedown', mousePressedHandler);
	document.addEventListener('mouseup', mouseReleasedHandler);

	display = document.getElementById('display');
	//Create backbuffer
	buffer = document.createElement('canvas');
	buffer.width = display.width;
	buffer.height = display.height;
	renderContext = buffer.getContext('2d');
	renderContext.imageSmoothingEnabled = false;
	
	//Setup levels
	//Tiles
	var tiles = [
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.sand, TileType.sand, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.sand, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.wall, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.sand, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracksCrossing, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracksCrossing, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks,
		TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.sand, TileType.sand, TileType.sand, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.sand, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.sand, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall,
		//
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.sand, TileType.sand, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.sand, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.wall, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.sand, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracksCrossing, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracksCrossing, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks,
		TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.sand, TileType.sand, TileType.sand, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.sand, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.sand, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall,
		//
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.sand, TileType.sand, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.sand, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.wall, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.sand, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracksCrossing, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracksCrossing, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks, TileType.tracks,
		TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.sand, TileType.sand, TileType.sand, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.sand, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.sand, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall,
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall
	];

	var tiles2 = [
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, 
		TileType.wall, TileType.wall, TileType.wall, TileType.grass, TileType.wall, TileType.wall, TileType.wall, TileType.wall, 
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, 
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, 
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, 
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, 
		TileType.wall, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.grass, TileType.wall, 
		TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall, TileType.wall 
	];

	//Make them
	levels.push(new Level("Test Outside", tiles, 18, 60));
	levels.push(new Level("Test Inside", tiles2, 8, 8));
	//Init level entities
	levels[1].entityRegister(new Trashcan(1, 2));
	levels[0].entityRegister(new Portal(new Vector2(8, 9), 1, new Vector2(3, 2)));
	levels[1].entityRegister(new Portal(new Vector2(3, 1), 0, new Vector2(8, 8)));
	//levels[0].entityRegister(new Train(20, 5, 0, 0));
	initFirstLevel();
	
	//Test
	var poolTrees = createEntityPool(Tree, 100, 0);	//Because we absolutely need 50 trees...
	
	for(var y = 0; y < currentLevel.tileCountY; y++)
	{
		for(var x = 0; x < currentLevel.tileCountX; x++)
		{
			var tile = getTile(x, y);
			if(tile == TileType.grass)
			{
				if(Math.random() > 0.92)
				{
					var t = requestFromPool(poolTrees);
					t.pos = tileToWorld(x, y);
					t.visible = true;
				}
			}
		}
	}
	
	//Set the viewport target to the player
	viewport.target = player;
	viewport.calcSize();
	
	//Start the game loop
	prevTime = new Date().getTime();
	intervalId = window.setInterval(gameTick, targetFrameTime);
	
	// Networking
	net.onclose = onNetClosed;
	if(net.ready === true)
	{
		onNetReady();
	}
	else
	{
		console.log(net.ready);
		net.onopen = onNetReady;
	}
}

function onNetClosed()
{
	dialogWindow.show("Lost connection to the server...");
}

function onNetReady()
{
	var msg = {
	  type: "con_start",
	  username: "Henk-" + (Math.random() * 100),
	};
	net.sendJSON(msg);
	
	document.title = msg.username;
	
	net.onmessage = handleNetworkMessage;
}

function handleNetworkMessage(obj)
{
	//console.log(obj);
	if(obj.type == "game_update")
	{
		console.log("Game update!");
		// Spawns
		for(var i = 0; i < obj.spawns.length; i++)
		{
			var netId = readNetId(obj.spawns[i].entityId);
			if(netId != player.netId)
			{
				var spawnedEntity;
				if(obj.spawns[i].type == "Player")
				{
					var newPlayer = new Player(4, 4);
					newPlayer.netId = netId;
					spawnedEntity = newPlayer;
				}
				else if(obj.spawns[i].type == "Train")
				{
					spawnedEntity = new Train(100, 100, 0, 0);
					spawnedEntity.netId = netId;
				}
				else
				{
					console.log("Unknown entity type: " + obj.spawns[i].type);
					continue;
				}
				
				if(obj.spawns[i].values)
				{
					var vals = obj.spawned[i].values;
					for(var k = 0; k < vals.length; k++)
					{
						if(vals[k].Key in spawnedEntity)
						{
							console.log("FOUND " + vals[k].Key + " IN ENTITY");
							spawnedEntity[vals[k].Key] = vals[k].Value;
						}
						else
						{
							console.log("DID NOT FIND " + vals[k].Key + " IN ENTITY");
						}
					}
				}
				
				levels[0].entityRegister(spawnedEntity);
				net.netcollection.entityRegister(spawnedEntity);
				spawnedEntity.enable();
			}
		}
		
		// Updates
		for(var i = 0; i < obj.updates.length; i++)
		{
			var netId = readNetId(obj.updates[i].entityId);
			if(obj.updates[i].entityId != player.netId || true)
			{
				var updateEntity = net.netcollection.entityFind(netId);
				
				if(obj.updates[i].values)
				{
					var vals = obj.updates[i].values;
					for(var k = 0; k < vals.length; k++)
					{
						if(vals[k].Key in updateEntity)
						{
							if(obj.updates[i].entityId != player.netId)
							{
								if(vals[k].Key == "level" && updateEntity.level != vals[k].Value)
								{
									levels[updateEntity.level].entityRemove(updateEntity);
									levels[vals[k].Value].entityRegister(updateEntity);
									if(vals[k].Value != currentLevelIndex)
									{
										updateEntity.disable();
									}
									else
									{
										updateEntity.enable();
									}
									
									console.log("Moved entity from level " + updateEntity.level + " to " + vals[k].Value);
								}
							}
							
							//console.log("FOUND " + vals[k].Key + " IN ENTITY ");
							updateEntity[vals[k].Key] = vals[k].Value;
						}
						else
						{
							console.log("DID NOT FIND " + vals[k].Key + " IN ENTITY ");
							console.log(updateEntity);
						}
					}
				}
			}
		}
		
		// Removals
		for(var i = 0; i < obj.removals.length; i++)
		{
			var netId = readNetId(obj.removals[i].entityId);
			var removedEntity = net.netcollection.entityFind(netId);
			
			if(net.netcollection.entityRemove(netId))
			{
				console.log("Entity removed!");
			}
			else
			{
				console.log("Could not remove entity!");
			}
			
			if(levels[0].entityRemove(removedEntity))
			{
				console.log("Entity removed from level!");
			}
			else
			{
				console.log("Could not remove entity from level!");
			}
		}
	}
	else if(obj.type == "game_player_spawned")
	{
		console.log("Player spawned!");
		player.netId = readNetId(obj.playerEntityId);
		player.ownedByPlayer = true;
		net.netcollection.entityRegister(player);
		
		var displayMessage = "Welcome to " + obj.serverName + "!\r\n" + obj.serverMessage;
		dialogWindow.show(displayMessage);
	}
}

var gameTickCount = 0;

function gameTick()
{
	//Calculate time since the start of the previous frame (in seconds)
	var curTime = new Date().getTime();
	var deltaTime = (curTime - prevTime) / 1000;
	prevTime = curTime;
	
	//Update and draw the world
	gameUpdateAndRender(deltaTime);
	
	// Do network stuff
	if(gameTickCount % 6 == 0)
	{
		gameNetworkSend();
	}
	
	//Button stuff
	for(var i = 0; i < buttons.length; i++)
	{
		buttons[i].wasDown = buttons[i].isDown;
	}
	
	//Flip the screen
	screenFlip();
	gameTickCount++;
}

function gameNetworkSend()
{
	if(net.ready)
	{
		var updates = [];
		/*for(var i = 0; i < net.netcollection.entities.length; i++)
		{
			var ent = net.netcollection.entities[i];
			if(ent)
			{
				if(ent.ownedByPlayer)
				{
					updates.push(ent.getNetworkMessage());
				}
			}
		}*/
		
		if(player.ownedByPlayer)
		{
			updates.push(player.getNetworkMessage());			
		}
		
		var message = {
			updates: updates,
			type: "game_update"
		}
		
		net.sendJSON(message);
	}
}

function gameUpdateAndRender(deltaTime)
{
	//Update global entities
	for(var i = 0; i < globalEntities.length; i++)
	{
		if(globalEntities[i].enabled)
		{
			globalEntities[i].update(deltaTime);
		}
	}
	
	//Update level entities
	for(var i = 0; i < currentLevel.entities.length; i++)
	{
		if(currentLevel.entities[i].enabled)
		{
			currentLevel.entities[i].update(deltaTime);
		}
	}
	
	//Update viewport
	//viewport.calcSize();
	
	if(viewport.target != null)
	{
		var halfOverPPU = 0.5 / viewport.pixelsPerUnit;
		viewport.pos = v2Subtract(viewport.target.pos, new Vector2(buffer.width * halfOverPPU, buffer.height * halfOverPPU));
	}
	else
	{
		var dp = new Vector2(0, 0);
		var vpSpeed = 10;
		if(buttons[ButtonIndex.up].isDown)
		{
			dp.y += vpSpeed;
		}
		if(buttons[ButtonIndex.down].isDown)
		{
			dp.y -= vpSpeed;
		}
		if(buttons[ButtonIndex.left].isDown)
		{
			dp.x -= vpSpeed;
		}
		if(buttons[ButtonIndex.right].isDown)
		{
			dp.x += vpSpeed;
		}
		viewport.pos = v2Add(viewport.pos, v2Multiply(dp, deltaTime));
	}
	
	//Restrain viewport to world
	/*if(viewport.pos.x < 0){
		viewport.pos.x = 0;
	}
	if(viewport.pos.y < 0){
		viewport.pos.y = 0;
	}
	if(viewport.pos.x > (TILE_SIZE * TILE_COUNT_X - viewport.size.x)){
		viewport.pos.x = (TILE_SIZE * TILE_COUNT_X - viewport.size.x);
	}
	if(viewport.pos.y > (TILE_SIZE * TILE_COUNT_Y - viewport.size.y)){
		viewport.pos.y = (TILE_SIZE * TILE_COUNT_Y - viewport.size.y);
	}*/
	
	
	/*
	*	Render code
	*/
	//'Clear' screen
	//renderContext.clear() is not working, as usual
	renderContext.fillStyle = '#000000';
	renderContext.fillRect(0, 0, buffer.width, buffer.height);
	
	//Draw tiles
	//Get viewport start and end in tile positions
	var viewportTileStartX = clamp(Math.floor(viewport.pos.x / TILE_SIZE), 0, currentLevel.tileCountX);
	var viewportTileStartY = clamp(Math.floor(viewport.pos.y / TILE_SIZE), 0, currentLevel.tileCountY);
	var viewportTileEndX = clamp(Math.ceil((viewport.pos.x + viewport.size.x) / TILE_SIZE), 0, currentLevel.tileCountX);
	var viewportTileEndY = clamp(Math.ceil((viewport.pos.y + viewport.size.y) / TILE_SIZE), 0, currentLevel.tileCountY);
	//Only draw visible tiles
	for(var y = viewportTileStartY; y < viewportTileEndY; y++)
	{
		for(var x = viewportTileStartX; x < viewportTileEndX; x++)
		{
			drawTile(x, y);
		}
	}
	
	//Efficient? Probably not
	var renderList = [];
	
	//Push global entities
	for(var i = 0; i < globalEntities.length; i++)
	{
		if(globalEntities[i].visible)
		{
			renderList.push(globalEntities[i]);
		}
	}
	
	//Push level entities
	for(var i = 0; i < currentLevel.entities.length; i++)
	{
		if(currentLevel.entities[i].visible)
		{
			renderList.push(currentLevel.entities[i]);
		}
	}
	
	//Sort the render list by z value. Higher z means rendered later.
	//Each y level counts for a z of 10.
	renderList.sort(function(a, b){
		return (-a.pos.y * 10 + a.sprite.z) - (-b.pos.y * 10 + b.sprite.z);
	});
	
	//And render the darn things
	for(var i = 0; i < renderList.length; i++)
	{
		renderList[i].render();
		drawWorldRect(renderList[i].pos.x - 0.05, renderList[i].pos.y + 0.05, 0.1, 0.1, '#0000FF');
	}
	
	//Draw debug text
	renderContext.fillStyle = '#00FF00';
	renderContext.font = '11px Arial';
	renderContext.fillText('Player x: ' + player.pos.x, 10, 20);
	renderContext.fillText('Player y: ' + player.pos.y, 10, 40);
	renderContext.fillText('Tile x: ' + player.currentTile.x, 10, 60);
	renderContext.fillText('Tile y: ' + player.currentTile.y, 10, 80);
	renderContext.fillText('Tile x: ' + player.targetTile.x, 10, 100);
	renderContext.fillText('Tile y: ' + player.targetTile.y, 10, 120);
	
	renderContext.fillText('Mouse, x: ' + mouse.x + '  y: ' + mouse.y, 200, 20);
	renderContext.fillText('dt: ' + deltaTime, 200, 40);
	
	renderContext.fillText('Level: ' + currentLevel.name, display.width - 150, 20);
}
