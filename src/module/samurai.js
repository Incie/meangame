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

    gameObject.players = samurai.createPlayers(gameObject.numPlayers);
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
    gameObject.gameid = samurai.createRandomId();

    callback(gameObject);
};

samurai.createPlayers = function(numPlayers){
    var players = [];
    for( var i = 0; i < numPlayers; i += 1 ){
        var player = {};
        player.name = 'unassigned';
        player.turn = i;
        player.deck = samurai.createDeck();
        player.usedCards = [];
        player.hand = [];
        player.color = colors[i];
        samurai.dealHand(player.hand, player.deck);

        players.push(player);
    }

    return players;
};

samurai.dealHand = function(hand, deck){
    while( hand.length < 6 ){
        var randomNumber = Math.random() * deck.length;
        if( randomNumber < deck.length && randomNumber >= 0 ){
            var randomIndex = Math.floor(randomNumber);
            var card = deck.splice(randomIndex, 1);
            hand.push(card[0]);
        }
    }
};

//Todo What is in a complete deck?
samurai.createDeck = function(){
    var deck = [];
    for( var s = 1; s <= 4; s += 1 ){
        deck.push( {suite: 'rice', size: s} );
        deck.push( {suite: 'buddha', size: s} );
        deck.push( {suite: 'hat', size: s} );
        deck.push( {suite: 'samurai', size: s} );
    }

    var ronin = { suite: 'ronin', quick: true, size: 1 };
    var boat1 = { suite: 'boat', quick: true, size: 1 };
    var boat2 = { suite: 'boat', quick: true, size: 2 };

    deck.push( ronin, ronin, boat1, boat1, boat2 );

    return deck;
};


samurai.createRandomId = function(n){
    var randomId = [];
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmopqrtuvwxyz123456789";

    var numChars = n || 6;

    for( var i = 0; i < numChars; i += 1 ){
        var index = Math.floor( Math.random() * possible.length );
        randomId.push(possible[index]);
    }

    return randomId.join('');
};

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

    //Add cards to the spent pile
    moves.forEach( move => { playerObject.usedCards.push(move); });

    //Draw new cards
    while( playerObject.hand.length < 6 && playerObject.deck.length != 0 ){
        var cardIndex = Math.floor(playerObject.deck.length * Math.random());
        var draw = playerObject.deck.splice(cardIndex, 1);
        playerObject.hand.push( draw[0] );
    }

    gameObject.moveList.push(moves);
    gameObject.turnCounter++;
    gameObject.playerTurn = (gameObject.playerTurn + 1) % gameObject.numPlayers;

    callback({success: true, game: gameObject });
};


module.exports = samurai;
