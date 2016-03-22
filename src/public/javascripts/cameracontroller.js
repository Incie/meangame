var cameracontroller = function(tjs){
    var state = {
        moving: false
    };

    var camera = tjs.getCamera();

    function onMouseWheel(event){
        var zoom = 1;
        if( event.wheelDelta < 0 )
            zoom = -1;

        var camera = tjs.getCamera();
        camera.zoom += zoom * 0.2;
        camera.zoom = Math.max(camera.zoom, 0.3);
        camera.updateProjectionMatrix();
    }

    function onMouseDown(event) {
        if( event.button == 2 ){
            state.moving = true;
            event.preventDefault();
        }
    }

    var onMouseUp = function(event) {
        if( event.button == 2 ){
            state.moving = false;
            event.preventDefault();
        }
    };

    var onContextMenu = function(event){
        event.preventDefault();
        return false;
    };

    function onMouseMove(event) {
        if( state.moving ){
            camera.position.x -= event.movementX / camera.zoom;
            camera.position.y -= event.movementY / camera.zoom;
        }
    }

    tjs.rendererEventListener('mousewheel', onMouseWheel);
    tjs.rendererEventListener('mousedown', onMouseDown);
    tjs.rendererEventListener('mouseup', onMouseUp);
    tjs.rendererEventListener('mousemove', onMouseMove);
    tjs.rendererEventListener('contextmenu', onContextMenu);
};