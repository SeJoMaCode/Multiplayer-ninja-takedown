window.addEventListener('DOMContentLoaded', DOMContentLoaded => {

    // INITIALIZE CANVAS
    const render = document.querySelector('canvas').getContext('2d'); 
    const U_SCALE = 128; 
    let w, h, u; 
    let socketOpen = false;
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
    const movement = {ArrowRight: false, ArrowLeft: false, ArrowDown: false, ArrowUp: false, KeyW: false, KeyA: false, KeyS: false, KeyD: false, Space: false}; 
    document.addEventListener('keydown', keydown => {
        if(movement.hasOwnProperty(keydown.code)) {
            movement[keydown.code] = true; 
        }
    }); 
    document.addEventListener('keyup', keyup => {
        if(movement.hasOwnProperty(keyup.code)) {
            movement[keyup.code] = false; 
        }
    });

    const nameToColor = name => {
        const HEX = ('00000'+(parseFloat(name)*(1<<24)|0).toString(16)).slice(-6).match(/.{1,2}/g)
        return [parseInt(HEX[0], 16), parseInt(HEX[1], 16), parseInt(HEX[2], 16)]
    }

    let frame_number = false; 
    let frame_count = 0;
    let player_direction = 0;
    const IMG_SIDE = 16; 
    let points = 0
    let oldPoints = points
    let px = Math.floor(Math.random() * (238 - -126) ) + -126, py = Math.floor(Math.random() * (238 - -126) ) + -126;
    const GAME = 'ninja_top_down'; 
    const NAME = Math.random().toString();
    const PCOLOR = nameToColor(NAME)
    const enemies = {}; 
    const socket = new WebSocket('wss://ninja-takedown.onrender.com/ws'); 
    // const socket = new WebSocket('ws://localhost:8080/ws'); 
    socket.addEventListener('open', open => {
        console.log('WEBSOCKET STARTED'); 
        socketOpen = true
        send(JSON.stringify({x: px, y: py, direction: player_direction, frame_number: frame_number}));
        send('connected')
    }); 
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
            if(parsed.Name === target){
                target = false
            }
            return; 
        }
        if(parsed.Message === 'connected') {
            send(JSON.stringify({x: px, y: py, direction: player_direction, frame_number: frame_number}));
            return; 
        }
        if(parsed.Message === NAME) {
            console.log('tagged');
            px = Math.floor(Math.random() * (238 - -126) ) + -126, py = Math.floor(Math.random() * (238 - -126) ) + -126;
            send(JSON.stringify({x: px, y: py, direction: player_direction, frame_number: frame_number}));
            return;
        }
        if(parsed.Message[0] === '{'){
            enemies[parsed.Name] = JSON.parse(parsed.Message);
        }
    }); 
    window.addEventListener('unload', unload => {
        send('goodbye'); 
        unload['returnValue'] = null; 
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

    let target
    let havePressSpace

    // ANIMATION LOOP
    const animation = timestamp => {
        
        if(!target && Object.keys(enemies).length > 0){
            target = Object.keys(enemies)[Math.floor(Object.keys(enemies).length * Math.random())]
        }

        // INITIALIZE ANIMATION
        frame_count++; 
        render.clearRect(0, 0, w, h); 
        render.fillRect(w / 2, h / 2, u, u); 
        render.save(); 
        render.scale(u, u); 
        render.fillStyle = patterns.floor; 
        render.fillRect(0, 0, w, h); 
        const tx = -Math.floor(px / U_SCALE) * U_SCALE, ty = -Math.floor(py / U_SCALE) * U_SCALE
        render.translate(tx, ty); 
        
        // PLAYER PHYSICS
        let left = movement.ArrowLeft || movement.KeyA, right = movement.ArrowRight || movement.KeyD, up = movement.ArrowUp || movement.KeyW, down = movement.ArrowDown || movement.KeyS; 
        let pvx = +right - +left; 
        let pvy = +down - +up; 
        if(right || up || left || down) {
            player_direction = right ? 1 : up ? 2 : down ? 3 : 0; 
            if(frame_count % 5 == 0) {
                frame_number = !frame_number; 
                if(socketOpen){
                    send(JSON.stringify({x: px, y: py, direction: player_direction, frame_number: frame_number}));
                }
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
            if(rigid_body.y + 1 <= py + IMG_SIDE && py < rigid_body.y + rigid_body.h - 1 && rigid_body.x + 1<= px + IMG_SIDE && px <= rigid_body.x + rigid_body.w - 1) {
                px = rigid_body.x + rigid_body.w + 1
                if(socketOpen){
                    send(JSON.stringify({x: px, y: py, direction: player_direction, frame_number: frame_number}));
                }
            }
        }); 
        px += pvx;
        py += pvy;
        if(pvx || pvy) {
            if(socketOpen){
                send(JSON.stringify({x: px, y: py, direction: player_direction, frame_number: frame_number})); 
            }
        }
        
        // RENDER DYNAMIC OBJECTS
        render.fillStyle = patterns.building; 
        rigid_bodies.forEach(rigid_body => {
            render.fillRect(rigid_body.x, rigid_body.y, rigid_body.w, rigid_body.h); 
        }); 

        if(!movement.Space){
            oldPoints = points
        }
        let index = 0
        Object.values(enemies).forEach(enemy => {
            render.drawImage(player_avatar, +enemy.frame_number * IMG_SIDE, enemy.direction * IMG_SIDE, IMG_SIDE, IMG_SIDE, enemy.x, enemy.y, IMG_SIDE, IMG_SIDE); 
            
            const COLOR = nameToColor(Object.keys(enemies)[index])

            let imageData = render.getImageData(tx * u + enemy.x * u, ty * u + enemy.y * u, IMG_SIDE * u, IMG_SIDE * u + 5);
            for (let i=0;i<imageData.data.length;i+=4) {
                if(imageData.data[i]==255 && imageData.data[i+1]==0 && imageData.data[i+2]==0){
                    imageData.data[i]=COLOR[0];
                    imageData.data[i+1]=COLOR[1];
                    imageData.data[i+2]=COLOR[2];
                }
            }
            render.putImageData(imageData, tx * u + enemy.x * u, ty * u + enemy.y * u);

            let distance = Math.sqrt(Math.pow((px+IMG_SIDE/2)-(enemy.x+IMG_SIDE/2),2)+Math.pow((py+IMG_SIDE/2)-(enemy.y+IMG_SIDE/2),2))
            if(distance <= IMG_SIDE && Object.keys(enemies)[index] === target && movement.Space && points === oldPoints) {
                send(Object.keys(enemies)[index]);
                target = Object.keys(enemies)[Math.floor(Object.keys(enemies).length * Math.random())]
                points++
            }
            index++;
        }); 

        render.drawImage(player_avatar, +frame_number * IMG_SIDE, player_direction * IMG_SIDE, IMG_SIDE, IMG_SIDE, px, py, IMG_SIDE, IMG_SIDE); 

        let pimageData = render.getImageData(tx * u + px * u, ty * u + py * u, IMG_SIDE * u, IMG_SIDE * u);
        for (let i=0;i<pimageData.data.length;i+=4) {
            if(pimageData.data[i]==255 && pimageData.data[i+1]==0 && pimageData.data[i+2]==0){
                pimageData.data[i]=PCOLOR[0];
                pimageData.data[i+1]=PCOLOR[1];
                pimageData.data[i+2]=PCOLOR[2];
            }
        }
        render.putImageData(pimageData, tx * u + px * u, ty * u + py * u);

        render.restore()

        render.textAlign = "center";
        render.fillStyle = '#777'
        render.lineWidth = 4;
        render.strokeStyle = '#000';  
        render.fillRect(w/2-IMG_SIDE*4.5/2, 2, IMG_SIDE*4.5, IMG_SIDE*4.5+25)
        render.strokeRect(w/2-IMG_SIDE*4.5/2, 2, IMG_SIDE*4.5, IMG_SIDE*4.5+25)
        render.strokeRect(w/2-IMG_SIDE*4.5/2, 2, IMG_SIDE*4.5, IMG_SIDE*4.5+2)
        render.fillStyle = '#b00'
        render.font = "bold 16px Arial";
        if(target){
            render.fillText('TARGET', w/2-1, IMG_SIDE*4.5+22);
            let tColor = nameToColor(target) 
            render.drawImage(player_avatar, IMG_SIDE, IMG_SIDE*3, IMG_SIDE, IMG_SIDE, w/2-IMG_SIDE*4.5/2, 4, IMG_SIDE*4.5, IMG_SIDE*4.5);
            let timageData = render.getImageData(w/2-IMG_SIDE*4.5/2, 4, IMG_SIDE*4.5, IMG_SIDE*4.5);
            for (let i=0;i<timageData.data.length;i+=4) {
                if(timageData.data[i]==255 && timageData.data[i+1]==0 && timageData.data[i+2]==0){
                    timageData.data[i]=tColor[0];
                    timageData.data[i+1]=tColor[1];
                    timageData.data[i+2]=tColor[2];
                }
            }
            render.putImageData(timageData, w/2-IMG_SIDE*4.5/2, 4);
        } else {
            render.fillText('NO', w/2-1, IMG_SIDE+20, IMG_SIDE*4.5-6);
            render.fillText('TARGET', w/2-1, IMG_SIDE+36, IMG_SIDE*4.5-6);
        }

        render.font = `bold ${4*u}px Arial`;

        if(movement.Space === true){havePressSpace = true}
        if(!havePressSpace){
            render.fillText('Press "space" to tag your target', w/2, w-(u*5));
        }

        render.textAlign = "left";
        render.fillText(`${points} TAG(S)`, 4*u, 6*u);

        setTimeout(animation, 1000 / 30)
        // window.requestAnimationFrame(animation)        
    }; 
    window.requestAnimationFrame(animation); 
}); 
