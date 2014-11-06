#Battleship Server API
A very simple REST api for the CS4962 Android Battleship MVC assignment. All request and responses are in JSON and follow JSON guidelines. "{ }" represent a dictionary of Key:Value pairs (can also be thought of as an object, where keys are class variables), and "[ ]" represent an array. 

The board is a 10x10 grid with rows and columns ranging from [0-9].

Response will use HTTP status codes.

* `200` - Request handled successfully
* `4xx` - User request was not handled because the user request is malformed, missing parameters, or attempting to access a resource that is not allowed.
* `5xx` - Server error. Please tell me what you did to receive this error.

In the case of a `4xx` or `5xx` error, check the `message` property in the top level of the JSON response.


## <u>Games</u>

###Get game detail
Get details for the game with the provided id. Id is a GUID.
#####Request: GET /api/games/:id
	{
		"id": GUID,
		"name": STRING,
		"player1": STRING,
		"player2": STRING,
		"winner": STRING
	}
	
###Get game list
Get all games currently on the server.
#####Request: GET /api/games
#####Response:
	[
		{
			"id": INT,
			"name": STRING
			"status" ENUM
		},
		...
	]
Status ENUM: DONE, WAITING, PLAYING

- DONE: Game has finished. No more actions are allowed
- WAITING: Game needs a second player. Allowed to join
- PLAYING: Game is currently in progress. Cannot join.

###Join the game with the given id
Join the game with the provided id. Id is a GUID.
#####Request: POST /api/games/:id/join
	{
		"playerName": STRING
	}
#####Response:
	{
		"playerId": GUID
	}
	
### Create a new Game
Create a new game with the provided name. Game will be in a `WAITING` status until another player joins the game. Once a player joins, the status will change to `PLAYING`. The player who created the game will become player 1 and will be provided a GUID to identify the player.
#####Request: POST /api/games
	{
		"gameName": STRING,
		"playerName": STRING
	}
	
#####Response:
	{
		"playerId": GUID,
		"gameId": GUID
	}
	
## <u>In Game</u>

###Making a guess
Make a guess to try and hit a ship.
#####Request: POST /api/games/:id/guess
	{
		"playerId": GUID,
		"xPos": INT,
		"yPos": INT				
	}
	
#####Response:
	{
		"hit": BOOLEAN
		"shipSunk": BOOLEAN
	}
	
###Whose turn is it
Use to poll the server and determine the players turn. Can be used when waiting for an opponent player to join the game, i.e. will return false for player 1 on a new game until an opponent player has joined. If the game is in progress, `winner` will be `null`. If the game is over, `winner` will contain the name of the player who won the game.
#####Request: POST /api/games/:id/status
	{
		"playerId": GUID
	}

#####Response:
	{
		"isYourTurn": BOOLEAN,
		"winner" : STRING
	}
	
###Get Players Board
Will return the status of the player's entire board for the game with the given id. The board is represented as a list of cells. `playerBoard` represents the players own board (ships and all), while the `opponentBoard` shows the current players hits and misses against the opponent.

Status ENUM: HIT, MISS, NONE

- HIT: a player has hit this cell
- MISS: a player has missed this cell
- SHIP: this cell is part of a ship and has not been hit
- NONE: this cell has no activity

#####Request: POST /api/games/:id/board
	{
		"playerId": GUID
	}
#####Response: 
	{
		"playerBoard": [
			{
				"x": INT,
				"y": INT,
				"status": ENUM
			},
			...
		],
		"opponentBoard": [
			{
				"x": INT,
				"y": INT,
				"status": ENUM
			},
			...
		]
	}
	
