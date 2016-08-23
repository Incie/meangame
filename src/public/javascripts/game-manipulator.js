function getGame(){
    fetch( 'json/game0.json').then( r=>r.json() ).then( parseGameObject );
}

let game = {};

function intToRGB(color){
    return 'rgb('+((color&0xFF0000)>>16)+','+((color&0xFF00)>>8)+','+(color&0xFF)+')';
}

function parseGameObject(json){
    document.getElementById('gameinfo').value = JSON.stringify( {
        name: json.roomName,
        numPlayers: json.numPlayers,
        owner: json.ownerName,
        gameid: json.gameid
    }, null, 1);

    let moveListElement = document.getElementById('movelist');
    moveListElement.innerHTML = '';
    json.moveList.forEach( (move, index) => {
        let color = json.players.find(p=>p.name===move.player).color;
        let rgbcolor = intToRGB(color);

        let s = '<div onclick="rewindTo('+index+')" style="background-color:'+rgbcolor+'">';
        s+= (index+1) + ': ' + move.player ;
        s+= '</div>';
        moveListElement.innerHTML += s;
    });

    var hexColors = ['#ff2424', '#33fa86', '#ff7111', '#be5ecf'];
    let gameElement = document.getElementById('board');
    gameElement.innerHTML = '';
    json.map.data.forEach(tile=>{
        let left = tile.x * 35 + gameElement.offsetTop;
        let top = tile.y * 35 + gameElement.offsetLeft;
        if( tile.y % 2 == 0 )
            left += 35 / 2;
        let color = hexColors[tile.type];

        if( tile.move !== undefined )
            color = intToRGB(tile.move.color);
        let s = '<div style="position:absolute; width:35px; height: 35px; left:'+left+'px;top: '+top+'px;background-color: '+color+'"></div>'
        gameElement.innerHTML += s;
    });


    game = json;
}

function rewindTo(moveIndex){
    let spliced = game.moveList.splice(moveIndex, game.moveList.length - moveIndex);
    spliced.forEach( moveSplice => {
        moveSplice.moves.forEach( move => {
            tile = game.map.data.find( t => move.x==t.x && move.y==t.y );
            delete tile.move;
        })
    });

    parseGameObject(game);
}