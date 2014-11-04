/**
 * Created by Andres Monroy (HyveMynd) on 11/4/14.
 */

var HomeRoutes = function(app){
    app.route('/')
        .get(function (req, res, next) {
            res.render('home', {title: 'Battleship Server'})
        })
};

module.exports = HomeRoutes;