var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongojs = require('mongojs');
var db = mongojs('samurai', ['samurai']);

var app = express();

//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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

app.get('/editor', function(req, res){
    console.log( 'get req on /editor ' + req.connection.remoteAddress );
    res.sendFile(files.editor);
});

app.get('/api/maps', function(req, res){
    var limitResponse = {name:1, size:1,_id:0};
    db.samurai.find({},limitResponse, function( err, docs) {
        res.json(docs);
    });
});

app.post('/api/maps/post', function(req, res){
    console.log('someone posted a map');

    var map = req.body;

    db.samurai.find({name: map.name}, function(err, docs){
        if( err ){
            res.send({success:false, message: err});
            return;
        }

        if( docs.length > 0 ){
            res.send({success:false, message: 'name already exists'});
            return;
        }

        db.samurai.insert( req.body, function(err, docs){
            if( err ) {
                console.log('error, ', err);
                res.send({success:false, error: err});
                return;
            }

            res.send({success: true});
        });
    });
});

var port = (process.env.PORT || '3000')
app.listen(port, function() {
    console.log('listening on '+port);
});