
var samurai = {};

//gameInfo { roomName, ownerName, numPlayers, mapName, password, isPrivate }
//mapObject { name, size {x,y}, data }
samurai.createGame = function(gameInfo, mapObject){
    var gameObject = {};
    gameObject.roomName = gameInfo.roomName;
    gameObject.numPlayers = gameInfo.numPlayers;
    gameObject.ownerName = gameInfo.ownerName;
    gameObject.mapName = gameInfo.mapName;

    gameObject.map = mapObject.clone();

    gameObject.players = samurai.createPlayers(gameobject.numPlayers);
    gameObject.players[0].name = gameObject.ownerName;

    gameObject.status = 'waiting for players';
    gameObject.turnCounter = 0;
    gameObject.playerTurn = Math.floor( (Math.random() * 123456) ) % gameInfo.numPlayers;
    gameObject.gameid = samurai.createRandomId();

    return gameObject;
};

samurai.createPlayers = function(numPlayers){
    for( var i = 0; i < numPlayers; i += 1 ){
        var player = {};
        player.name = 'unassigned';
        player.deck = samurai.createDeck();
        player.usedCards = [];
        player.hand = [];
        samurai.dealHand(player.hand, player.deck);
    }
};

samurai.dealHand = function(hand, deck){
    while( hand.length < 6 ){
        var randomNumber = Math.random() * deck.length;
        if( randomNumber < deck.length && randomNumber >= 0 ){
            var randomIndex = Math.floor(randomNumber);
            var card = deck.splice(randomIndex, 1);
            hand.push(card);
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

    var ronin = { suite: ronin, quick: true, size: 1 };
    var boat1 = { suite: boat, quick: true, size: 1 };
    var boat2 = { suite: boat, quick: true, size: 2 };

    deck.push( ronin, ronin.clone(), boat1, boat1.clone(), boat2.clone() );
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


module.exports.samurai = samurai;
