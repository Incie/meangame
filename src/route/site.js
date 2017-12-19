let path = require('path');
const express = require('express');
const router = express.Router();

function getAbsolutePath(relativePath){
    return path.join(__dirname, '..', '/public/', relativePath);
}

const files = {
    index: getAbsolutePath('samurai.html'),
    editor: getAbsolutePath('editor.html'),
    game: getAbsolutePath('game.html'),
    replay: getAbsolutePath('gamereplay.html'),
    login: getAbsolutePath('login.html'),
    signup: getAbsolutePath('signup.html')
};

router.get('/', function(req, res){res.sendFile(files.index);});
router.get('/game/', function(req, res){res.sendFile(files.game);});
router.get('/editor', function(req, res){res.sendFile(files.editor);});
router.get('/replay', function(req, res){res.sendFile(files.replay);});
router.get('/login', function(req, res){res.sendFile(files.login);});
router.get('/signup', function(req, res){res.sendFile(files.signup);});

module.exports = router;
