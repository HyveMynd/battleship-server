/**
 * Created by Andres Monroy (HyveMynd) on 3/11/15.
 */
"use strict";

var assert = require('assert');

var GameRoutes = function(express){
    var router = express.Router();

    router.put('/games');
    router.post('/games');
    router.post('/games/boards');

    return router;
};

module.exports = GameRoutes;