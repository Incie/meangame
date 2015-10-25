var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongojs = require('mongojs');
var db = mongojs('samurai', ['samurai']);

var app = express();

//app.use(logger('dev'));
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb'}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

var getAbsolutePath = function(relativePath){
    return path.join(__dirname, '/public/', relativePath);
};

var files = {
    index: getAbsolutePath('index.html'),
    editor: getAbsolutePath('editor.html')
};

app.get('/', function(req, res){
    console.log( 'get req on / ' + req.connection.remoteAddress );
    res.sendFile(files.index);
});

app.post('/game/create', function(req, res){
    //map exist?
    //valid players?
    //player too many games created?
    //---> errormessage

    //create game in db
    //generate game id
     //check if game id exists
    //--> clone data from map for playing

    //create playerdata with all tiles avail in db
    //send back ID

    console.log(req.body);


    res.send('baschbavha');
});

app.post('/game/:gameid/turn', function(req, res){
    //send move as [ {x, y, type, num} ]


    //get game
    // gameid not found?

    //this players turn?
    //validate move?

    //register move
    //check board-state
    // change occupied cities if needed

    //remove used drawn tiles
    //draw new tiles
});

app.get('/game/:gameid', function(req, res){
    console.log('/game/'+req.params.gameid);

    //look up game i
    //send board
});

app.get('/editor', function(req, res){
    console.log( 'get req on /editor ' + req.connection.remoteAddress );
    res.sendFile(files.editor);
});

app.get('/api/maps', function(req, res){
    console.log('/api/maps');
    var limitResponse = {name:1, size:1,_id:0};
    db.samurai.find({},limitResponse, function( err, docs ) {
        if( err ) {console.log(err);res.send({success:false, message: 'db error' }); }
        res.json(docs);
    });
});

app.get('/api/maps/get/:name', function(req, res){
    var mapName = req.params.name;
    console.log(mapName);

    db.samurai.find({name: mapName}, {_id:0}, function(err, docs){
        if( err ) {
            res.send({success:false, message: 'db error'});
            return;
        }

        if( docs.length === 0 ){
            res.send({success:false, message: 'map "' +mapName+ '" not found'});
            return;
        }

        var mapObject = docs[0];
        res.send({success:true, map: mapObject});

    });
});


var updateMap = function(map, docs, response){
    if( map.size.x*map.size.y != map.data.length ){
        console.log('size mismatch');
        response.send({success:false, message: 'size mismatch'});
        return;
    }

    db.samurai.update( {_id: docs[0]._id}, { $set : {data: map.data, size: map.size}}, function(err, docs){
        if( err ){
            console.log(err);
            response.send({success: false, message: 'could not update map'});
            return;
        }

        response.send({success: true, message: 'map updated'});
    });
};

app.post('/api/maps/post', function(req, res){
    console.log('/api/maps/post');

    var map = req.body;

    db.samurai.find({name: map.name}, function(err, docs){
        if( err ){
            res.send({success:false, message: 'db error'});
            console.log(err);
        }
        else if( docs.length > 0 )
            updateMap(map, docs, res);
        else {
            db.samurai.insert( req.body, function(err, docs){
                if( err ) {
                    console.log('error, ', err);
                    res.send({success:false, message: err});
                    return;
                }

                res.send({success: true, message: 'map saved'});
            });
        }
    });
});

var port = (process.env.PORT || '3000')
app.listen(port, function() {
    console.log('listening on '+port);
});