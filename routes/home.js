/**
 * Created by Andres Monroy (HyveMynd) on 11/4/14.
 */

var HomeRoutes = function(app, express){
    var router = express.Router();
    router.get('/partials/:name', function (req, res) {
        res.render('partials/' + req.params.name);
    });

    router.get('*', function(req, res) {
        res.render('index', { title: 'Battleship' });
    });

    app.use(router);
};

module.exports = HomeRoutes;