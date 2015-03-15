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

    router.post('/');
    router.get('/:id');
    router.get('/:id/boards');

    return router;
};

module.exports = GameRoutes;