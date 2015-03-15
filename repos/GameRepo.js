/**
 * Created by Andres Monroy (HyveMynd) on 3/11/15.
 */
"use strict";

var hyveRepo = require('hyve-repo');
var config = require('../config');

var GameRepo = function(){
    return hyveRepo.createRepository('Game', hyveRepo.getStrategy('orientdb')(config.host, config.port, config.username, config.password, config.db));
};

module.exports = GameRepo;