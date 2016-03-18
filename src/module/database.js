var mongojs = require('mongojs');
var db = mongojs('samurai', ['samurai']);

var dbModule = {};

function fail( response, msg ) { var obj = {success: false, message: msg }; return obj; }
function success(msg){ return { success: true, message:msg }; }

var updateMap = function(map, docs, callback){
    if( map.size.x*map.size.y != map.data.length ){
        console.log('error updating map: size mismatch');
        callback(fail(response, 'size mismatch'));
        return;
    }

    db.samurai.update( {_id: docs[0]._id}, { $set : {data: map.data, size: map.size}}, function(err, docs){
        if( err ){
            console.log('error updating map: ', err);
            callback(fail(response, 'could not update map'));
            return;
        }

        callback(success('map updated'));
    });
};

dbModule.saveOrUpdateMap = function(map, callback){
    db.samurai.find({name: map.name}, function(err, docs){
        if( err ){
            console.log('error saving map: ', err);
            callback(fail(response, 'error saving map'));
            return;
        }
        else if( docs.length > 0 )
            return updateMap(map, docs, callback);
        else {
            db.samurai.insert( req.body, function(err, docs){
                if( err ) {
                    console.log('error inserting map, ', err);
                    callback(fail(response, 'err'));
                    return;
                }

                callback(success('map saved'));
            });
        }
    });
};

dbModule.getMapList = function(callback){
    var limitResponse = {name:1, size:1,_id:0};
    db.samurai.find({},limitResponse, function( err, docs ) {
        if( err ) {
            callback(fail('error trying to get maps' + err));
            return;
        }

        var mapObject = success(''+docs.length+' maps');
        mapObject.mapList = docs;
        callback(mapObject);
    });
};

dbModule.getMap = function(mapName, callback){
    db.samurai.find({name: mapName}, {_id:0}, function(err, docs){
        if( err ) {
            callback(fail('error getting map: ' + err));
            return;
        }

        if( docs.length === 0 ){
            callback(fail('map not found: ' + mapName));
            return;
        }

        var mapData = docs[0];
        var mapObject = success(mapName, 'ok');
        mapObject.mapData = mapData;

        callback(mapObject)
    });
};

module.exports.dbModule = dbModule;