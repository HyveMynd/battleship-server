/**
 * Created by Andres Monroy (HyveMynd) on 3/9/15.
 */
"use strict";

var Promise = require('bluebird');
var uuid = require('node-uuid');
var GameRepo = require('../repos/GameRepo');
var PlayerRepo = require('../repos/PlayerRepo');
var _ = require('underscore');

var LobbyRoutes = function (express) {
    var router = express.Router();
    var gameRepo = new GameRepo();
    var playerRepo = new PlayerRepo();

    var isAlpha = function (string) {
        return string && string.match(/^[a-z0-9 ]+$/i);
    };

    var isValidName = function (string) {
        var str = string.toLowerCase();
        return str !== "in progress"
            && str !== 'done'
            && str != 'waiting'
            && str != 'playing'
            && str != 'winner'
            && str != 'ship'
            && str != 'hit'
            && str != 'miss'
            && str != 'none'
    };

    var createEmptyBoard = function () {
        var board = [];
        for (var i = 0; i < 100; i++)board[i] = 0;

        // Convert board array to cell array
        var cells = new Array(100);
        for (var i = 0; i < board.length; i++){
            cells[i] = {
                xPos: i % 10,
                yPos: Math.floor(i / 10),
                status: 'NONE'
            }
        }
        return cells;
    };

    var createPlayerBoard = function () {
        var board = [];
        var ships = [];
        var boardSize = 10;
        var shipTypes = [5,4,3,3,2];
        for (var i = 0; i < boardSize * boardSize; i++) board[i] = 0;

        for (var i = 0; i <= shipTypes.length;)
        {
            // Choose random starting position and random direction
            var newPos = Math.floor(Math.random() * boardSize * boardSize);
            var newDir = Math.floor(Math.random() * 2);
            var horizontal = (newDir == 0);

            // Calculate end points for the ship
            var x = newPos % 10;
            var y = Math.floor(newPos / 10);
            var newX = x;
            var newY = y;

            if (horizontal == true)
            {
                newX = x + shipTypes[i];
            }
            else
            {
                newY = y + shipTypes[i];
            }

            // If ship is out of bounds of the board, try again
            if (newX >= boardSize || newY >= boardSize)
            {
                continue;
            }

            // Check if the position of the new ship contains no ships
            var positionValid = true;
            for (var j = 0; j < shipTypes[i]; j++)
            {
                var testX = x + (newDir == 0 ? j : 0);
                var testY = y + (newDir != 0 ? j : 0);
                if (board[testY * 10 + testX] != 0)
                {
                    positionValid = false;
                    break;
                }
            }
            // Try again if the ship position is not valid
            if (positionValid == false)
            {
                continue;
            }

            // Position Valid, place the ship
            ships[i] = [];
            for (var j = 0; j < shipTypes[i]; j++)
            {
                var testX = x + (newDir == 0 ? j : 0);
                var testY = y + (newDir != 0 ? j : 0);
                board[testY * 10 + testX] = 1;
                ships[i].push(testY * 10 + testX);
            }

            // Try the next ship size
            i++;
        }


        var shipTiles = 0;
        var expectedShipTiles = 0;
        for (var i = 0; i < shipTypes.length; i++) expectedShipTiles += shipTypes[i];
        for (var i = 0; i < boardSize * boardSize; i++)
        {
            if (board[i] != 0)
            {
                shipTiles++;
            }
        }

        if (shipTiles != expectedShipTiles)
        {
            console.log(util.format('Actual: %d, Expected: %d', shipTiles, expectedShipTiles));
            throw new Error("Unexpected number of ships");
        }

        // Create ship objects
        var data = {
            board: board,
            ships: []
        };

        for (var i = 0; i < ships.length; i++){
            var ship = ships[i];
            if (ship.length > 0) {
                data.ships.push({
                    length: ship.length,
                    positions: ship,
                    hits: [],
                    sunk: 0
                });
            }
        }

        // Convert board array to cell array
        var cells = new Array(100);
        for (var i = 0; i < board.length; i++){
            cells[i] = {
                xPos: i % 10,
                yPos: Math.floor(i / 10),
                status: (board[i]) == 0 ? 'NONE' : 'SHIP'
            }
        }
        data.board = cells;
        return data;
    };

    var sendError = function (err) {
        this.next(err);
    };

    var initPlayer = function (name) {
        var data = createPlayerBoard();
        return {
            id: uuid.v4(),
            name: name,
            playerBoard: data.board,
            opponentBoard: createEmptyBoard(),
            ships: data.ships
        }
    };

    var getGameWithId = function (req, res, next) {
        gameRepo.first({id: req.params.id})
            .then(function (game) {
                if (game){
                    req.game = game;
                    next()
                } else {
                    res.status(400).json({message: 'Game with the given id does not exist'})
                }
        }).catch(sendError).done();
    };

    var namesAreAlphaNumeric = function (names) {
        return function (req, res, next) {
            for (var i = 0; i < names.length; i++){
                if (!isAlpha(req.body[names[i]])){
                    return res.status(400).json({message: 'Names must be alphanumeric'});
                }
            }
            next();
        }
    };

    var namesAreValid = function (names) {
        return function (req, res, next) {
            for (var i = 0; i < names.length; i++){
                if (!isValidName(req.body[names[i]])){
                    return res.status(400).json({message: 'Name is not valid'});
                }
            }
            next();
        }
    };

    var gameIsValid = function (req, res, next) {
        gameRepo.find()
    };

    /**
     * Get a list of games
     */
    router.get('/', function (req, res, next) {
        gameRepo.all()
            .bind({req: req, res: res, next: next})
            .then(function (games) {
                var gamesArr = [];
                _.each(games, function (game) {
                    gamesArr.push({
                        id:game.id,
                        name:game.name,
                        status: game.status
                    })
                });
                res.json(gamesArr)
            }).catch(sendError).done()
    });

    /**
     * Get a specific game
     */
    router.get('/:id', getGameWithId, function (req, res, next) {
        var game = req.game;
        var data = {
            id: game.id,
            name: game.name,
            player1: '',
            player2: '',
            winner: game.winner,
            missilesLaunched: game.turns
        };

        gameRepo.find(game.player1)
            .bind({req: req, res: res, next: next})
            .then(function (player1) {
                data.player1 = player1.name;
                if (!game.player2){
                    res.json(data);
                } else {
                    gameRepo.find(game.player2).then(function (player2) {
                        data.player2 = player2.name;
                        res.json(data);
                    });
                }
        }).catch(sendError).done();
    });

    var createGame = function (player) {
        var game = {
            name: this.req.body.gameName,
            id: uuid.v4(),
            player1: player['@rid'],
            status: 'WAITING',
            winner: 'IN PROGRESS',
            turns: 0
        };
        return gameRepo.create(game)
            .bind(this)
            .then(function (game) {
                this.res.json({
                    playerId: player.id,
                    gameId: game.id
                }).catch(sendError).done();
            })
    };

    var createPlayer = function (playerName) {
        var player = initPlayer(playerName);
        return playerRepo.create(player);
    };

    /**
     * Create a New Game
     */
    router.post('/',
        namesAreAlphaNumeric(['gameName', 'playerName']),
        namesAreValid(['gameName', 'playerName']),
        function (req, res, next) {
            createPlayer(req.body.playerName)
                .bind({req: req, res: res, next: next})
                .then(createGame).catch(sendError).done();
        });


    //router.put('/',
    //    namesAreAlphaNumeric(['playerName']),
    //    namesAreValid(['playerName']),
    //    gameIsValid(),
    //    function (req, res) {
    //
    //    });

    return router;
};

module.exports = LobbyRoutes;