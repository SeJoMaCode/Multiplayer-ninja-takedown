window.addEventListener('DOMContentLoaded', DOMContentLoaded => {

    const socket = new WebSocket('wss://southwestern.media/game_dev'); 
    socket.addEventListener('open', open => {
        console.log('WEBSOCKET STARTED'); 
    }); 

    // INITIALIZE CANVAS
    const render = document.querySelector('canvas').getContext('2d'); 
    const U_SCALE = 128; 
    let w, h, u; 
    const resize = () => {
        w = render.canvas.width = render.canvas.clientWidth * window.devicePixelRatio; 
        h = render.canvas.height = render.canvas.clientHeight * window.devicePixelRatio; 
        u = h / U_SCALE; 
        render.imageSmoothingEnabled = false; 
    }; 
    resize(); 
    window.addEventListener('resize', resize); 

    // INITIALIZE IMAGE
    const player_avatar = new Image(); 
    player_avatar.src = 'images/player_spritesheet.png';

    // PLAYER INPUT
    const movement = {ArrowRight: false, ArrowLeft: false, ArrowDown: false, ArrowUp: false}; 
    document.addEventListener('keydown', keydown => {
        if(movement.hasOwnProperty(keydown.key)) {
            movement[keydown.key] = true; 
        }
    }); 
    document.addEventListener('keyup', keyup => {
        if(movement.hasOwnProperty(keyup.key)) {
            movement[keyup.key] = false; 
        }
    });

    const GAME = 'ninja_top_down'; 
    const NAME = Math.random().toString(); 
    const enemies = {}; 
    const send = message => {
        socket.send(JSON.stringify({Game: GAME, Name: NAME, Message: message})); 
    }; 
    socket.addEventListener('message', message => {
        const parsed = JSON.parse(message.data); 
        if(parsed.Game !== GAME || parsed.Name === NAME) {
            return; 
        }
        if(parsed.Message === 'goodbye') {
            console.log('GOODBYE'); 
            delete enemies[parsed.Name]; 
            return; 
        }
        enemies[parsed.Name] = JSON.parse(parsed.Message); 
    }); 
    const enemy_avatar = new Image(); 
    enemy_avatar.src = 'images/enemy_spritesheet.png';
    socket.addEventListener('beforeunload', beforeunload => {
        send('goodbye'); 
        beforeunload['returnValue'] = null; 
    }); 

    const patterns = {};
    const floor = new Image()
    floor.src = 'images/floor.png'
    floor.addEventListener('load', load => {
        patterns.floor = render.createPattern(floor, 'repeat')
    })
    const building = new Image()
    building.src = 'images/building.png'
    building.addEventListener('load', load => {
        patterns.building = render.createPattern(building, 'repeat')
    })

    // RIGID_BODY
    class Rigid_Body {
        constructor(x, y, w, h) {
            this.x = x; 
            this.y = y; 
            this.w = w; 
            this.h = h; 
        }
    }
    const rigid_bodies = []; 
    rigid_bodies.push(new Rigid_Body(254, -128, 2, 384))
    rigid_bodies.push(new Rigid_Body(-128, -128, 2, 384))
    rigid_bodies.push(new Rigid_Body(-128, -128, 384, 2))
    rigid_bodies.push(new Rigid_Body(-128, 254, 384, 2))
    rigid_bodies.push(new Rigid_Body(-72, -84, 32, 32))
    rigid_bodies.push(new Rigid_Body(-96, 16, 32, 32))
    rigid_bodies.push(new Rigid_Body(-56, 154, 32, 32))
    rigid_bodies.push(new Rigid_Body(16, -96, 32, 32))
    rigid_bodies.push(new Rigid_Body(64, 64, 32, 32))
    rigid_bodies.push(new Rigid_Body(45, 196, 32, 32))
    rigid_bodies.push(new Rigid_Body(154, -48, 32, 32))
    rigid_bodies.push(new Rigid_Body(183, 64, 32, 32))
    rigid_bodies.push(new Rigid_Body(145, 154, 32, 32))

    // ANIMATION LOOP
    let frame_number = false; 
    let frame_count = 0;
    let player_direction = 0;
    let px = 16, py = 16;
    const IMG_SIDE = 16; 
    let points = 0
    const animation = timestamp => {
        
        // INITIALIZE ANIMATION
        frame_count++; 
        render.clearRect(0, 0, w, h); 
        render.fillRect(w / 2, h / 2, u, u); 
        render.save(); 
        render.scale(u, u); 
        render.fillStyle = patterns.floor; 
        render.fillRect(0, 0, w, h); 
        render.translate(-Math.floor(px / U_SCALE) * U_SCALE, -Math.floor(py / U_SCALE) * U_SCALE); 
        
        // PLAYER PHYSICS
        let left = movement.ArrowLeft, right = movement.ArrowRight, up = movement.ArrowUp, down = movement.ArrowDown; 
        let pvx = +right - +left; 
        let pvy = +down - +up; 
        if(right || up || left || down) {
            player_direction = right ? 1 : up ? 2 : down ? 3 : 0; 
            if(frame_count % 10 == 0) {
                frame_number = !frame_number; 
            }
        }

        // COLLIDERS
        rigid_bodies.forEach(rigid_body => {
            if(rigid_body.y <= py + IMG_SIDE && py < rigid_body.y + rigid_body.h) {
                if(px + IMG_SIDE <= rigid_body.x && rigid_body.x < px + IMG_SIDE + pvx) {
                    pvx = 0; 
                    px = rigid_body.x - IMG_SIDE; 
                }
                if(rigid_body.x + rigid_body.w <= px && px + pvx < rigid_body.x + rigid_body.w) {
                    pvx = 0; 
                    px = rigid_body.x + rigid_body.w; 
                }
            }
            if(rigid_body.x <= px + IMG_SIDE && px <= rigid_body.x + rigid_body.w) {
                if(py + IMG_SIDE <= rigid_body.y && rigid_body.y < py + IMG_SIDE + pvy) {
                    pvy = 0; 
                    py = rigid_body.y - IMG_SIDE; 
                }
                if(rigid_body.y + rigid_body.h <= py && py + pvy < rigid_body.y + rigid_body.h) {
                    pvy = 0; 
                    py = rigid_body.y + rigid_body.h;
                }
            }
        }); 
        px += pvx; 
        py += pvy;
        if(pvx || pvy) {
            send(JSON.stringify({x: px, y: py, direction: player_direction, frame_number: frame_number})); 
        }
        
        // RENDER DYNAMIC OBJECTS
        render.fillStyle = patterns.building; 
        rigid_bodies.forEach(rigid_body => {
            render.fillRect(rigid_body.x, rigid_body.y, rigid_body.w, rigid_body.h); 
        }); 

        render.drawImage(player_avatar, +frame_number * IMG_SIDE, player_direction * IMG_SIDE, IMG_SIDE, IMG_SIDE, px, py, IMG_SIDE, IMG_SIDE); 

        var imageData = render.getImageData(px * u, py * u, IMG_SIDE * u, IMG_SIDE * u);
        for (var i=0;i<imageData.data.length;i+=4) {
            if(imageData.data[i]==255 && imageData.data[i+1]==0 && imageData.data[i+2]==0){
                imageData.data[i]=0;
                imageData.data[i+1]=0;
                imageData.data[i+2]=255;
            }
        }
        render.putImageData(imageData, px * u, py * u);

        Object.values(enemies).forEach(enemy => {
            render.drawImage(enemy_avatar, +enemy.frame_number * IMG_SIDE, enemy.direction * IMG_SIDE, IMG_SIDE, IMG_SIDE, enemy.x, enemy.y, IMG_SIDE, IMG_SIDE); 
            let distance = Math.sqrt(Math.pow((px+IMG_SIDE/2)-(enemy.x+IMG_SIDE/2),2)+Math.pow((py+IMG_SIDE/2)-(enemy.y+IMG_SIDE/2),2))
            if(distance <= IMG_SIDE) {
                console.log('COLLISION');
                px = Math.floor(Math.random() * (238 - -126) ) + -126
                py = Math.floor(Math.random() * (238 - -126) ) + -126
                points++
                send(JSON.stringify({x: px, y: py, direction: player_direction, frame_number: frame_number}));
            }
        }); 


        render.restore()
        render.fillStyle = '#b00'
        render.font = "bold 30px Arial";
        render.fillText(`${points} TAGS`, 16, 40);
        window.requestAnimationFrame(animation); 
    }; 
    window.requestAnimationFrame(animation); 
}); 