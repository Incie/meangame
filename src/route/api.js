let express = require('express');
let users = require('../module/users');
var api = require('../module/api');

let router = express.Router();

router.post('/login', function(req, res){
    users.login( req.body )
        .then( function(userObject){
            console.log('authenticated user', userObject.user);
            req.session.authenticated = true;
            req.session.user = {
                id: userObject.id,
                name: userObject.name
            };
            req.session.save( function(err){
                res.send( {message:'Logged In'});
            });
        })
        .catch(function(message){
            req.session.destroy( function(err){
                res.status(401).send( {message:"Incorrect."} );
            });
        });
});

router.post('/logout', function(req, res){
    req.session.destroy( function(err){
        res.send({message: 'Logged out'});
    });
});

router.post('/signup', function(req, res){
    let user = req.body.user;
    let password = req.body.pass;
    let name = req.body.name;

    //validate, escape

    users.registerUser(user, password, name)
        .then( error => {
            if( error ){
                res.status(400).send({message: error });
                return;
            }

            res.status(200).send({message:'Signup Successful'});
        })
        .catch( msg => {
            res.status(400).send({message:msg});
        });
});


router.all('*', function(req, res, next){
    if( req.session.authenticated ){
        next();
        return;
    }

    res.status(401).send({message:'forbidden'});
});

router.get( '/maps',                    api.getMapList);
router.post('/maps/',                   api.saveOrUpdateMap);
router.get( '/maps/:name',              api.getMap);
router.delete('/maps/:name',            (req,res) => {res.send('NYI');});

router.get('/lobby/available',           api.getAvailableGames );
router.post('/lobby/mygames',            api.getMyGames );

router.post('/game/',                   api.createGame);
router.post('/game/:gameid/tick',       api.gameTick);
router.get( '/game/:gameid',            api.getGameInfo);
router.put( '/game/:gameid',            api.gameTurn);
router.post('/game/:gameid',            api.joinGame);

router.get('/game-replay/:gameid',         api.replayGame);
router.put('/game-replay/:gameid/:turnid', api.replayGameTo);

router.get(   '/game/admin/games',     api.adminGetGames);
router.delete('/game/:gameid/admin',   api.adminDeleteGame);
router.get(   '/game/:gameid/admin',   api.adminGetGameStatus);

router.get('/whoami', function(req, res){
    res.status(200).send({name:req.session.user.name});
});

module.exports = router;