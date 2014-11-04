/**
 * Created by Andres Monroy (HyveMynd) on 11/4/14.
 */

var routes = function(app, express){
    var router = express.Router();

    /**
     * Validate Id
     */
    router.use('/games/:id', function (req, res, next) {
        if (req.params.id >= 1){
            next();
        } else {
            res.status(400).json({message:'Id must be a positive integer'});
        }
    });

    /**
     * Get a list of games
     */
    router.get('/games', function (req, res, next) {
        res.send('getting all games');
    });

    /**
     * Get a game
     */
    router.get('/games/:id', function (req, res, next) {
        res.send('getting game. id=' + req.params.id);
    });

    /**
     * Create a game
     */
    router.post('/games', function (req, res, next) {
        res.send('game created');
    });

    /**
     * Join game
     */
    router.post('/games/:id/join', function (req, res, next) {
        res.send('joining game id=' + req.params.id);
    });

    app.use('/api', router);
};

module.exports = routes;