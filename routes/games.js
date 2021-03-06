/**
 * Created by Andres Monroy (HyveMynd) on 11/4/14.
 */
var server = require('oriento')({
    host: 'localhost',
    port: 2424,
    username: 'root',
    password: 'password'
});
var db = server.use('battleship-db');
var uuid = require('node-uuid');
var async = require('async');
var _ = require('underscore');
var util = require('util');

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

var createPlayer = function (name) {
    var data = createPlayerBoard();
    return {
        id: uuid.v4(),
        name: name,
        playerBoard: data.board,
        opponentBoard: createEmptyBoard(),
        ships: data.ships
    }
};

var isAlpha = function (string) {
    return string && string.match(/^[a-z0-9 ]+$/i);
};

var isGUID = function (string) {
    return string && string.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
};

var checkValidGame = function (req, res, next) {
    db.select().from('game').where({id: req.params.id}).one().then(function (game) {
        if (game){
            req.game = game;
            next();
        } else {
            res.status(400).json({message: 'A game with that id does not exist'})
        }
    });
};

var checkValidPlayerForGame = function (req, res, next) {
    db.record.get(req.game.player1).then(function (player1) {
        db.record.get(req.game.player2).then(function (player2) {
            req.player1 = player1;
            req.player2 = player2;

            if (player1.id === req.body.playerId || player2.id === req.body.playerId){
                next();
            } else {
                res.status(400).json({message: 'The player does not belong to this game'});
            }
        })
    })
    
};

var checkValidPlayerId = function (req, res, next) {
    if (isGUID(req.body.playerId)){
        next();
    } else {
        res.status(400).send('Player id is not a valid GUID');
    }
};

var updateGameAndPlayers = function (req, res) {
    db.update('game').set(req.game).where({id: req.game.id}).scalar().then(function (results) {
        console.log('Guess: Updated Game: ' + results);
        db.update('player').set(req.player).where({id: req.player.id}).scalar().then(function (results) {
            console.log('Guess: Updated player: ' + results);
            db.update('player').set(req.opponent).where({id: req.opponent.id}).scalar().then(function (results) {
                console.log('Guess: Updated opponent: ' + results);
                res.json({
                    hit: req.hit || false,
                    shipSunk: req.sunk || 0
                });
            });
        });
    });
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

var routes = function(app, express){
    var router = express.Router();

    /**
     * Validate Id
     */
    router.use('/games/:id', function (req, res, next) {
        if (isGUID(req.params.id)){
            next();
        } else {
            res.status(400).json({message:'Must provide a valid GUID'});
        }
    });

    /**
     * Get a list of games
     */
    router.get('/games', function (req, res) {
        db.select().from('game').all().then(function (games) {
            var gamesArr = [];
            _.each(games, function (game) {
                gamesArr.push({
                    id:game.id,
                    name:game.name,
                    status: game.status
                })
            });
            res.json(gamesArr);
        });
    });

    /**
     * Get a game
     */
    router.get('/games/:id', function (req, res, next) {
        db.select().from('game').where({id: req.params.id}).one().then(function (game) {
            if (game){
                req.game = game;
                next();
            } else {
                res.status(400).json({message: 'Game with the given id does not exist'});
            }
        });
    }, function (req, res) {
        var game = req.game;
        var data = {
            id: game.id,
            name: game.name,
            player1: '',
            player2: '',
            winner: game.winner,
            missilesLaunched: game.turns
        };
        db.record.get(game.player1).then(function (player1) {
            data.player1 = player1.name;
            if (!game.player2){
                res.json(data);
            } else {
                db.record.get(game.player2).then(function (player2) {
                    data.player2 = player2.name;
                    res.json(data);
                });
            }
        });
    });

    /**
     * Create a game
     */
    router.post('/games', function (req, res, next) {
        if (!isAlpha(req.body.gameName) || !isAlpha(req.body.playerName)){
            res.status(400).json({message: 'Names must be alphanumeric'});
        } else {
            next();
        }
    }, function (req, res, next) {
        if (!isValidName(req.body.gameName) || !isValidName(req.body.playerName)){
            res.status(400).json({message: 'Name is not valid'});
        } else {
            next()
        }
    }, function (req, res) {
        var player1 = createPlayer(req.body.playerName);
        db.insert().into('player').set(player1).one().then(function (player) {
            var game = {
                name: req.body.gameName,
                id: uuid.v4(),
                player1: player['@rid'],
                status: 'WAITING',
                winner: 'IN PROGRESS',
                turns: 0
            };
            db.insert().into('game').set(game).one().then(function (game) {
                res.json({
                    playerId: player.id,
                    gameId: game.id
                });
            })
        });
    });

    /**
     * Join game
     */
    router.post('/games/:id/join', function (req, res, next) {
        if(isAlpha(req.body.playerName)){
            next();
        } else {
            res.status(400).json({message: 'Player name must be alphanumeric'});
        }
    }, function (req, res, next) {
        if (isValidName(req.body.playerName)) {
            next()
        } else {
            res.status(400).json({message: 'Name is not valid'});
        }
    }, function (req, res, next) {
        checkValidGame(req, res, next);
    }, function (req, res) {
        if (req.game.status != 'WAITING') {
            res.status(400).json({message: 'The game cannot be joined'});
        } else {
            req.game.status = 'PLAYING';
            var player2 = createPlayer(req.body.playerName);
            db.insert().into('player').set(player2).one().then(function (player2) {
                req.game.player2 = player2['@rid'];
                req.game.isPlayer1Turn = true;
                db.update('game').set(req.game).where({id: req.game.id}).scalar().then(function (results) {
                    console.log('Join Game: Updated ' + results + ' game');
                    res.json({playerId: player2.id});
                });
            });
        }
    });

    /**
     * Whose turn is it
     */
    router.post('/games/:id/status', function (req, res, next) {
        checkValidGame(req, res, next);
    }, function (req, res, next) {
        checkValidPlayerId(req, res, next);
    }, function (req, res, next) {
        if (req.game.status === "WAITING"){
            res.json({
                isYourTurn: false,
                winner : req.game.winner
            })
        } else {
            next();
        }
    }, function (req, res, next) {
        checkValidPlayerForGame(req, res, next);
    }, function (req, res) {
        if (req.player1.id === req.body.playerId && req.game.isPlayer1Turn){
            res.json({
                isYourTurn: true,
                winner : req.game.winner
            });
        } else if (req.player2.id === req.body.playerId && !req.game.isPlayer1Turn){
            res.json({
                isYourTurn: true,
                winner : req.game.winner
            });
        } else {
            res.json({
                isYourTurn: false,
                winner : req.game.winner
            });
        }
    });

    /**
     * Get Player board
     */
    router.post('/games/:id/board', function (req, res, next) {
        checkValidGame(req, res, next);
    }, function (req, res, next) {
        checkValidPlayerId(req, res, next);
    }, function (req, res, next) {
        if (req.game.status !== 'PLAYING' && req.game.status !== 'DONE'){
            res.status(400).json({message: 'Game is not in play.'})
        } else {
            next();
        }
    }, function (req, res, next) {
        checkValidPlayerForGame(req, res, next);
    }, function (req, res) {
        if (req.player1.id === req.body.playerId){
            res.json({
                playerBoard: req.player1.playerBoard,
                opponentBoard: req.player1.opponentBoard
            });
        } else if (req.player2.id === req.body.playerId) {
            res.json({
                playerBoard: req.player2.playerBoard,
                opponentBoard: req.player2.opponentBoard
            });
        } else {
            res.status(400).json({message: 'Player does not belong to game.'})
        }
    });

    /**
     * Make guess
     */
    router.post('/games/:id/guess', function (req, res, next) {
       checkValidGame(req, res, next);
    }, function (req, res, next) {
        if (req.game.status === 'PLAYING'){
            next();
        } else {
            res.status(400).json({message: 'Game is not in play.'});
        }
    }, function (req, res, next) {
        checkValidPlayerId(req, res, next);
    }, function (req, res, next) {
        checkValidPlayerForGame(req, res, next);
    }, function (req, res, next) {
        req.x = parseInt(req.body.xPos);
        req.y = parseInt(req.body.yPos);
        var x = req.x;
        var y = req.y;
        if (x >= 0 && y >= 0 && x < 10 && y < 10){
            next();
        } else {
            console.log('invalid x/y');
            res.status(400).json({message: 'X and/or Y coordinates are invalid'});
        }
    }, function (req, res, next) {
        if (req.player1.id === req.body.playerId){
            if (req.game.isPlayer1Turn){
                req.player = req.player1;
                req.opponent = req.player2;
                next();
            } else {
                console.log('not turn 1');
                res.status(400).json({message: 'Not your turn'});
            }
        } else {
            if (!req.game.isPlayer1Turn){
                req.player = req.player2;
                req.opponent = req.player1;
                next();
            } else {
                console.log('not turn 2');
                res.status(400).json({message: 'Not your turn'});
            }
        }
    }, function (req, res, next) {
        var ships = req.opponent.ships;
        var index = (req.y * 10) + req.x;
        for (var i = 0; i < ships.length; i++){
            var ship = ships[i];
            if (_.contains(ship.hits, index)){
                req.game.name = 'I am a Teapot';
                req.game.winner = "Teapot";
                req.game.status = 'DONE';
                req.player.name = 'Short';
                req.opponent.name = 'Stout';
                updateGameAndPlayers(req, res);
                res.status(418).json({message: 'I am a teapot'});
                return;
            } else if (_.contains(ship.positions, index)){
                ship.hits.push(index);
                if (ship.hits.length === ship.positions.length){
                    ship.sunk = ship.positions.length;
                    req.sunk = ship.positions.length;
                }
                var play = _.findWhere(req.player.opponentBoard, {xPos: req.x, yPos: req.y});
                var opp = _.findWhere(req.opponent.playerBoard, {xPos: req.x, yPos: req.y});

                if (play)
                    play.status = "HIT";
                if (opp)
                    opp.status = "HIT";


                req.hit = true;
                next();
                return;
            }
        }

        // No hit was registered. Mark as miss and continue
        var play = _.findWhere(req.player.opponentBoard, {xPos: req.x, yPos: req.y});
        var opp = _.findWhere(req.opponent.playerBoard, {xPos: req.x, yPos: req.y});

        if (play)
            play.status = "MISS";
        if (opp)
            opp.status = "MISS";

        next();
    }, function (req, res) {
        if (_.all(req.opponent.ships, function (ship) {
                return ship.sunk !== 0;
            })){
            req.game.status = "DONE";
            req.game.winner = req.player.name;
        }
        req.game.isPlayer1Turn = !req.game.isPlayer1Turn;
        req.game.turns++;
        updateGameAndPlayers(req, res);
    });

    app.use('/api', router);
};

module.exports = routes;