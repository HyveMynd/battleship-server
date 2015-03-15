/**
 * Created by Andres Monroy (HyveMynd) on 3/15/15.
 */
"use strict";

var hyveRepo = require('hyve-repo');
var config = require('../config');

var LobbyRepo = function(){
    return hyveRepo.createRepository('Player', hyveRepo.getStrategy('orientdb')(config.host, config.port, config.username, config.password, config.db));
};

module.exports = LobbyRepo;