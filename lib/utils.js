/**
 * Created by Andres Monroy (HyveMynd) on 3/15/15.
 */
"use strict";

var GameRepo = require('./GameRepo');
var PlayerRepo = require('./PlayerRepo');
var uuid = require('node-uuid');
var _ = require('underscore');

var Utils = function(){
    var util = {};
    var gameRepo = new GameRepo();
    var playerRepo = new PlayerRepo();

    util.isAlpha = function (string) {
        return string && string.match(/^[a-z0-9 ]+$/i);
    };

    util.isValidName = function (string) {
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

    util.createEmptyBoard = function () {
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

    util.createPlayerBoard = function () {
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

    util.sendError = function (err) {
        this.next(err);
    };

    util.initPlayer = function (name) {
        var data = util.createPlayerBoard();
        return {
            id: uuid.v4(),
            name: name,
            playerBoard: data.board,
            opponentBoard: util.createEmptyBoard(),
            ships: data.ships
        }
    };

    util.getGameWithId = function (req, res, next) {
        var id = req.params.id || req.body.id;
        gameRepo.first({id: id})
            .then(function (game) {
                if (game){
                    req.game = game;
                    next()
                } else {
                    res.status(400).json({message: 'Game with the given id does not exist'})
                }
            }).catch(util.sendError).done();
    };

    util.namesAreAlphaNumeric = function (names) {
        return function (req, res, next) {
            for (var i = 0; i < names.length; i++){
                if (!util.isAlpha(req.body[names[i]])){
                    return res.status(400).json({message: 'Names must be alphanumeric'});
                }
            }
            next();
        }
    };

    util.namesAreValid = function (names) {
        return function (req, res, next) {
            for (var i = 0; i < names.length; i++){
                if (!util.isValidName(req.body[names[i]])){
                    return res.status(400).json({message: 'Name is not valid'});
                }
            }
            next();
        }
    };

    util.createGame = function (player) {
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
                }).catch(util.sendError).done();
            })
    };

    util.createPlayer = function (playerName) {
        var player = util.initPlayer(playerName);
        return playerRepo.create(player);
    };

    return util;
};

module.exports = Utils;