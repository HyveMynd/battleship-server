/**
 * Created by Andres Monroy (HyveMynd) on 3/11/15.
 */
"use strict";
var Utils = require('../lib/utils');
var GameRepo = require('../lib/GameRepo');
var PlayerRepo = require('../lib/PlayerRepo');
var _ = require('underscore');

var GameRoutes = function(express){
    var router = express.Router();
    var gameRepo = new GameRepo();
    var playerRepo = new PlayerRepo();
    var utils = new Utils();

    /**
     * Whose turn is it
     */
    router.get('/:id',
        utils.getGameWithId,
        utils.isValidPlayerId,
        function (req, res, next) {
            // Short circuit if the game is still waiting
            if (req.game.status === "WAITING"){
                res.json({
                    isYourTurn: false,
                    winner : req.game.winner
                })
            } else {
                next();
            }
        },
        utils.playerBelongsToGame,
        function (req, res) {
            if (req.player1.id === req.query.playerId && req.game.isPlayer1Turn){
                res.json({
                    isYourTurn: true,
                    winner : req.game.winner
                });
            } else if (req.player2.id === req.query.playerId && !req.game.isPlayer1Turn){
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
     * Get Player boards
     */
    router.get('/:id/boards',
        utils.getGameWithId,
        utils.isValidPlayerId,
        utils.gameIsInPlay,
        utils.playerBelongsToGame,
        function (req, res) {
            if (req.player1.id === req.query.playerId){
                res.json({
                    playerBoard: req.player1.playerBoard,
                    opponentBoard: req.player1.opponentBoard
                });
            } else if (req.player2.id === req.query.playerId) {
                res.json({
                    playerBoard: req.player2.playerBoard,
                    opponentBoard: req.player2.opponentBoard
                });
            } else {
                res.status(400).json({message: 'Player does not belong to game.'})
            }
        }
    );

    router.post('/',
        utils.getGameWithId,
        utils.gameIsInPlay,
        utils.isValidPlayerId,
        utils.playerBelongsToGame,
        utils.areValidPositions,
        utils.isPlayersTurn,
        function (req, res, next) {
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
                    return utils.updateGameAndPlayers(req.game, req.player, req.opponent).then(function () {
                        res.status(418).json({message: 'I am a teapot'});
                    });
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
                    return next();
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
        },
        function (req, res) {
            if (_.all(req.opponent.ships, function (ship) {
                    return ship.sunk !== 0;
                })){
                req.game.status = "DONE";
                req.game.winner = req.player.name;
            }
            req.game.isPlayer1Turn = !req.game.isPlayer1Turn;
            req.game.turns++;
            utils.updateGameAndPlayers(req.game, req.player, req.opponent).then(function () {
                res.json({
                    hit: req.hit || false,
                    shipSunk: req.sunk || 0
                });
            });
        }
    );

    return router;
};

module.exports = GameRoutes;