#Battleship Server API
A very simple REST api for the CS4962 Android Battleship MVC assignment. All request and responses are in JSON and follow JSON guidelines. "{ }" represent a dictionary of Key:Value pairs (can also be thought of as an object, where keys are class variables), and "[ ]" represent an array. 

RESTful API's use HTTP verbs to determine the type of operation to execute. The standard verbs and standard uses are as follows:

- GET - used to query for information from the server. Query parameters can be used to filter the requested data.
- POST - Asks the server to create a new resource. 
- PUT - Requests for a change or update to a resource. 
- DELETE - Remove a resouce.

NOTE: Only POST and PUT verbs can have a request body.

The board is a 10x10 grid with rows and columns ranging from [0-9].

Response will use standard HTTP status codes.

* `200` - Request handled successfully
* `4xx` - User request was not handled because the user request is malformed, missing parameters, or attempting to access a resource that is not allowed.
* `5xx` - Server error. Please tell me what you did to receive this error.

In the case of a `4xx` or `5xx` error, check the `message` property in the top level of the JSON response.

## <u> Game Lobby </u>

### Get list of games
Gets a list of games from the lobby. Query parameters may be used to filter the result set. For example, querying for completed or in progress games

##### Request: GET /api/v2/lobby
##### Valid Query Params:
- `status` - an string enum. Represents the status of the game. Acts as a filter.
- `results` - an integer. The number of results per result set.
- `offset` - an interger. The offset position to begin the result set. Zero based.

NOTE: If `results` is defined, so must `offset` and vice-versa. Defining one without the other will simply be ignored.

##### Response:
	[
		{
			"id": GUID,
			"name": STRING
			"status" ENUM
		},
		...
	]
	
`id` - The GUID of the game. This id is globally unique and can be used to find/update/delete this particular game. 

`name` - The user readable name of this game.

`status` ENUM: `DONE`, `WAITING`, `PLAYING`

- DONE: Game has finished. No more actions are allowed
- WAITING: Game needs a second player. Allowed to join
- PLAYING: Game is currently in progress. Cannot join.

NOTE: Providing no query parameters will return all games in the database. This may overwhelm the memory of your device. USE WITH CAUTION.

###Get game detail
Get details for the game with the provided id. 
#####Request: GET /api/v2/lobby/:id

`:id` - The GUID of the game you are searching for.

##### Response:
	{
		"id": GUID,
		"name": STRING,
		"player1": STRING,
		"player2": STRING,
		"winner": STRING,
		"status": ENUM,
		"missilesLaunched": INT
	}
	
`id` - The GUID of the game. This id is globally unique and can be used to find/update/delete this particular game. 

`name` - The user readable name of this game.

`player1` - The name of player 1.

`player2` - The name of player 2, if a second player has joined the game.

`winner` - The name of the winning player. Otherwise, `IN_PROGRESS`. 

`status` ENUM: `DONE`, `WAITING`, `PLAYING`

- DONE: Game has finished. No more actions are allowed
- WAITING: Game needs a second player. Allowed to join
- PLAYING: Game is currently in progress. Cannot join.

`misslesLaunched` - An integer representing the number of turns currently taken in the game.	

### Create a new Game
Create a new game with the provided name. Game will be in a `WAITING` status until another player joins the game. Once a player joins, the status will change to `PLAYING`. The player who created the game will become player 1 and will be provided a GUID to identify the player.
#####Request: POST /api/v2/lobby
	{
		"gameName": STRING,
		"playerName": STRING
	}
	
`gameName` - The user readable name for the game being created.

`playerName` - The user readable name of player 1 (the creator).
	
#####Response:
	{
		"playerId": GUID,
		"gameId": GUID
	}
	
`playerId` -  A GUID used to identify player1. Will be used in future requests to manipulate this game. SAVE IT.

`gameId` A GUID used to identify this game. Will be needed in future requests to manipulate this game. SAVE IT.

###Join the game with the given id
Join the game with the provided id. 

#####Request: PUT /api/v2/lobby/:id
`:id` - The GUID of the game you would like to query.

	{
		"playerName": STRING,
		"id": GUID
	}
	
`playerName` - The user readable name of player2. 

`id` - The GUID of the game this player would like to join.
	
#####Response:
	{
		"playerId": GUID
	}
	
`playerId` - A GUID used to identify player2. Will be used in future requests to manipulate this game. SAVE IT.
	
## <u>In Game</u>

###Making a guess
Make a guess to try and hit a ship.
#####Request: POST /api/v2/games/:id
`:id` - The GUID of the game you would like to query.


	{
		"playerId": GUID,
		"xPos": INT,
		"yPos": INT				
	}
	
`id` - The GUID of the game you would like to manupulate.

`playerId` - The GUID of the player making the move.

`xPos` - The x position of your guess.

`yPos` - The y position of you guess.
	
#####Response:
	{
		"hit": BOOLEAN
		"shipSunk": INT
	}
	
`hit` - True if this guess was a hit. False otherwise.

`shipSunk` - Correspondes to the size of the ship sunk. `0` if no ship was sunk.
	
###Whose turn is it
Use to poll the server and determine the players turn. Can be used when waiting for an opponent player to join the game, i.e. will return false for player 1 on a new game until an opponent player has joined. If the game is in progress, `winner` will be `IN PROGRESS`. If the game is over, `winner` will contain the name of the player who won the game.
#####Request: GET /api/v2/games/:id
`:id` - The GUID of the game you would like to query.

#####Valid Query Parameters
- `playerId` - The GUID of the player making the request. The player must belong to this game, otherwise the request will fail.

#####Response:
	{
		"isYourTurn": BOOLEAN,
		"winner" : STRING
	}
	
`isYourTurn` - True if it is currently this players turn. False, otherwise.

`winner` - The name of the player who won the game. Otherwise, `IN_PROGRESS`.
	
###Get Player Boards
Will return the status of the player's entire board for the game with the given id. The board is represented as a list of cells. `playerBoard` represents the players own board (ships and all), while the `opponentBoard` shows the current players hits and misses against the opponent. Both `playerBoard` and `opponentBoard` are represented as an array of cells with a cell containing its own state as: x position, y position, and status.

#####Request: GET /api/v2/games/:id/boards
`:id` - The GUID of the game you would like to query.

#####Valid Query Parameters
- `playerId` - The GUID of the player making the request. The player must belong to this game, otherwise the request will fail.
	
#####Response: 
	{
		"playerBoard": [
			{
				"xPos": INT,
				"yPos": INT,
				"status": ENUM
			},
			...
		],
		"opponentBoard": [
			{
				"xPos": INT,
				"yPos": INT,
				"status": ENUM
			},
			...
		]
	}
`xPos` - The x position of this cell.

`yPos` - The y position of this cell.	
	
`status` ENUM: `HIT`, `MISS`, `NONE`

- HIT: a player has hit this cell
- MISS: a player has missed this cell
- SHIP: this cell is part of a ship and has not been hit
- NONE: this cell has no activity

## <u>Game AI</u>
The server also comes with its own battleship AI and functions as follows:

The bot server polls every 30 seconds for games. If a game is named with the correct name, it will join automatically with the specified AI.

Valid Game Names:

- RANDOMBOT - Completely random.
- SPIRALBOT - Begins at the center and spiral out.
- SMARTBOT - Attempts to intelligently destroy your ships.

If you create a game with the name RANDOMBOT, the bot server will create a bot with the random AI and play against you.

The bot will continue to play against you until a winner has been declared. While the game is in progress, the bot will poll for your game with exponential backoff up to 1 minute. The bot will abandon games if there is no activity for 6 hours.
