/**
 * Created by Andres Monroy (HyveMynd) on 3/11/15.
 */
"use strict";
var Utils = require('../lib/utils');
var GameRepo = require('../lib/GameRepo');
var PlayerRepo = require('../lib/PlayerRepo');

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

    router.post('/');
    router.get('/:id/boards');

    return router;
};

module.exports = GameRoutes;