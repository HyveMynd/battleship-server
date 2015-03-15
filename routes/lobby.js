/**
 * Created by Andres Monroy (HyveMynd) on 3/9/15.
 */
"use strict";

var GameRepo = require('../lib/GameRepo');
var _ = require('underscore');
var Utils = require('../lib/utils');

var LobbyRoutes = function (express) {
    var router = express.Router();
    var gameRepo = new GameRepo();
    var utils = new Utils();

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
            }).catch(utils.sendError).done()
    });

    /**
     * Get a specific game
     */
    router.get('/:id', utils.getGameWithId, function (req, res, next) {
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
        }).catch(utils.sendError).done();
    });

    /**
     * Create a New Game
     */
    router.post('/',
        utils.namesAreAlphaNumeric(['gameName', 'playerName']),
        utils.namesAreValid(['gameName', 'playerName']),
        function (req, res, next) {
            utils.createPlayer(req.body.playerName)
                .bind({req: req, res: res, next: next})
                .then(utils.createGame).catch(utils.sendError).done();
        });

    /**
     * Join a Game
     */
    router.put('/',
        utils.namesAreAlphaNumeric(['playerName']),
        utils.namesAreValid(['playerName']),
        utils.getGameWithId,
        function (req, res, next) {
            if (req.game.status != 'WAITING') {
                res.status(400).json({message: 'The game cannot be joined'});
            } else {
                req.game.status = 'PLAYING';
                utils.createPlayer(req.body.playerName)
                    .bind({req: req, res: res, next: next})
                    .then(function (player2) {
                        req.game.player2 = player2['@rid'];
                        req.game.isPlayer1Turn = true;
                        gameRepo.update(req.game, {id: req.game.id})
                            .bind(this)
                            .then(function (results) {
                                console.log('Join Game: Updated ' + results + ' game');
                                res.json({playerId: player2.id});
                            }).done()
                    }).catch(utils.sendError).done();
            }
        });

    return router;
};

module.exports = LobbyRoutes;