var response = require('./response');

var samurai = {};
var colors = [ 0xff0000, 0x00ff00, 0x0000ff, 0xffff00 ];


//gameInfo { roomName, ownerName, numPlayers, mapName, password, isPrivate }
//mapObject { name, size {x,y}, data }
samurai.createGame = function(gameInfo, mapObject, callback){
    var gameObject = {};
    gameObject.roomName = gameInfo.roomName;
    gameObject.numPlayers = gameInfo.numPlayers;
    gameObject.ownerName = gameInfo.ownerName;
    gameObject.mapName = gameInfo.mapName;

    gameObject.map = mapObject;

    gameObject.players = createPlayers(gameObject.numPlayers);
    gameObject.players[0].name = gameObject.ownerName;

    gameObject.state = [];
    gameObject.players.forEach(function(player){
        gameObject.state.push({
            player: player.name,
            turn: player.turn,
            score: {
                religion: 0,
                politics: 0,
                trade: 0
            }
        });
    });

    gameObject.status = 'waiting for players';
    gameObject.turnCounter = 0;
    gameObject.moveList = [];
    gameObject.playerTurn = Math.floor( (Math.random() * 123456) ) % gameInfo.numPlayers;
    gameObject.gameid = createRandomId();

    callback(gameObject);
};

function createPlayers(numPlayers){
    var players = [];
    for( var i = 0; i < numPlayers; i += 1 ){
        var player = {};
        player.name = 'unassigned';
        player.turn = i;
        player.deck = createDeck();
        player.usedCards = [];
        player.hand = [];
        player.color = colors[i];

        dealHand(player.hand, player.deck);

        players.push(player);
    }

    return players;
}

function dealHand(hand, deck){
    while( hand.length < 6 ){
        var randomNumber = Math.random() * deck.length;
        if( randomNumber < deck.length && randomNumber >= 0 ){
            var randomIndex = Math.floor(randomNumber);
            var card = deck.splice(randomIndex, 1);
            hand.push(card[0]);
        }
    }
}

//Todo What is in a complete deck?
function createDeck() {
    let deck = [];
    for( let cardSize = 1; cardSize <= 4; cardSize += 1 ){
        deck.push( {suite: 'rice', size: cardSize} );
        deck.push( {suite: 'buddha', size: cardSize} );
        deck.push( {suite: 'hat', size: cardSize} );
        deck.push( {suite: 'samurai', size: cardSize} );
    }

    var ronin = { suite: 'ronin', quick: true, size: 1 };
    var boat1 = { suite: 'boat', quick: true, size: 1 };
    var boat2 = { suite: 'boat', quick: true, size: 2 };

    deck.push( ronin, ronin, boat1, boat1, boat2 );

    return deck;
}


function createRandomId(n) {
    var randomId = [];
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmopqrtuvwxyz123456789";

    var numChars = n || 6;

    for( var i = 0; i < numChars; i += 1 ){
        var index = Math.floor( Math.random() * possible.length );
        randomId.push(possible[index]);
    }

    return randomId.join('');
}

function validPlayerTurn( gameObject, player ){
    for( let i = 0; i < gameObject.players.length; i += 1 ){
        if( gameObject.players[i].name == player && gameObject.playerTurn == i)
            return true;
    }

    return false;
}

function validateHand(playerMoves, playerHand) {
    let validatedHand = true;
    playerMoves.every( move => {
        for( var i = 0; i < playerHand.length; i += 1 ){
            if( move.suite == playerHand[i].suite && move.size == playerHand[i].size ) {
                move.playerCard = playerHand.splice(i,1);
                return true;
            }
        }

        validatedHand = false;
        return false;
    });

    return validatedHand;
}

function validateMoves(mapObject, playerMoves, turnCount, playerColor, playerName){
    let validMapMoves = true;
    let normalMoveTaken = false;
    playerMoves.every( move => {
        var tile = mapObject.data.find( t => { return (move.x==t.x && move.y==t.y); } );

        if( !tile ) {
            validMapMoves = false;
            return false;
        }

        if( move.suite != 'boat' && move.suite != 'ronin' ){
            if( normalMoveTaken ){
                validMapMoves = false;
                return false;
            }

            normalMoveTaken = true;
        }

        if( tile.move !== undefined ){
            validMapMoves = false;
            return false;
        }

        if( move.suite == 'boat' && tile.type != 1 ) {
            validMapMoves = false;
            return false;
        }

        if( move.suite != 'boat' && tile.type != 2 ) {
            validMapMoves = false;
            return false;
        }

        tile.move = {
            color: playerColor,
            player: playerName,
            suite: move.suite,
            size: move.size,
            turn: turnCount
        };

        return true;
    });
    
    return validMapMoves;
}

samurai.processTurn = function(gameObject, player, moves, callback) {
    if( !validPlayerTurn(gameObject, player) ){
        callback( response.fail('Not your turn') );
        return;
    }

    var playerObject = gameObject.players.find( p => { return p.name == player; } );
    if( playerObject === undefined ){
        callback({success: false, error: 'player not found in gameobj: '+player});
        return;
    }

    if( !validateHand(moves, playerObject.hand) ){
        callback( response.fail('Failed hand validation'));
        return;
    }

    if( !validateMoves(gameObject.map, moves, gameObject.turnCounter, playerObject.color, playerObject.name) ) {
        callback( response.fail('Failed map validation') );
        return;
    }


    let cities = [];
    let tileOffsets = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];
    let specialOffsets = [
        [{x: 1, y:-1}, {x: -1, y:-1}], //%2 == 0
        [{x: 1, y: 1}, {x: -1, y: 1}]  //%2 == 1
    ];

    for( let i = 0; i < moves.length; i += 1 ){
        let move = moves[i];

        //certain tiles can't trigger a score update
        if( move.suite == 'boat' )
            continue;

        function findTilesFor(offset) {
            let tile = gameObject.map.data.find( tile => { return (tile.x == move.x && tile.y == move.y ) } );
            if( tile && tile.type == 3 )
                cities.push(tile);
        }

        let specialOffset = specialOffsets[ move.x % 2 ]; //validate %2?
        specialOffset.forEach(findTilesFor);
        tileOffsets.forEach(findTilesFor);
    }

    for( let i = 0; i < cities.length; i += 1 ){
        let city = cities[i];

        let cityTiles = [];

        function findCityTilesAround(offset){
            let cityTile = gameObject.map.data.find( tile => { return (tile.x == (city.x+offset.x) && tile.y == (city.y+offset.y)) });
            if( cityTile )
                cityTiles.push(cityTile);
        }

        let specialOffset = specialOffsets[ city.x % 2 ];
        specialOffset.forEach(findCityTilesAround);
        tileOffsets.forEach(findCityTilesAround);
        
        let isCitySurrounded = true;
        let cityInfluence = {};

        cityTiles.forEach( tile => {
            if( !tile.move ){
                isCitySurrounded = false;
                return;
            }

            //void or town
            if( tile.type == 0 || tile.type == 3 )
                return;

            //count cityInfluence
            let suite = tile.move.suite;
            if( tile.move.suite == 'boat' || tile.move.suite == 'samurai' || tile.move.suite == 'ronin' )
                suite = 'all';

            if( cityInfluence[ tile.move.player ][suite] == undefined ){
                cityInfluence[ tile.move.player ][suite] = 0;
            }

            cityInfluence[ tile.move.player ][suite] += tile.move.size;
        });

        if( isCitySurrounded ){
            console.log(cityInfluence);
            //calculate score
            //validate score
            //commit score
            //mark city as inactive
        }
    }


    //Add cards to the spent pile
    moves.forEach( move => { playerObject.usedCards.push(move); });

    //Draw new cards
    while( playerObject.hand.length < 6 && playerObject.deck.length != 0 ){
        var cardIndex = Math.floor(playerObject.deck.length * Math.random());
        var draw = playerObject.deck.splice(cardIndex, 1);
        playerObject.hand.push( draw[0] );
    }

    //TODO: Mark who made the move
    gameObject.moveList.push({player: playerObject.name, moves: moves});
    // gameObject.moveList.push(moves);
    gameObject.turnCounter++;
    gameObject.playerTurn = (gameObject.playerTurn + 1) % gameObject.numPlayers;

    callback({success: true, game: gameObject });
};


module.exports = samurai;
