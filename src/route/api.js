const express = require('express');
const users = require('../module/users');
const validate = require('validator');
const api = require('../module/api');

const router = express.Router();

router.post('/login', function(req, res){
    users.login( req.body )
        .then( function(userObject){
            console.log('authenticated user', userObject.user);
            req.session.authenticated = true;
            req.session.user = {
                id: userObject._id.toString(),
                name: userObject.name
            };
            req.session.save( function(){
                res.send( {message:'Logged In'});
            });
        })
        .catch(function(){
            req.session.destroy( function(){
                res.status(401).send( {message:"Incorrect."} );
            });
        });
});

router.post('/logout', function(req, res){
    req.session.destroy( function(){
        res.send({message: 'Logged out'});
    });
});

router.post('/signup', function(req, res){
    const user = validate.escape(req.body.user);
    const name = validate.escape(req.body.name);
    const password = req.body.pass;

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