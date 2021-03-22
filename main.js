window.addEventListener('DOMContentLoaded', DOMContentLoaded => {

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
    const enemy_avatar = new Image(); 
    enemy_avatar.src = 'images/enemy_spritesheet.png';

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
    const emovement = {right: false, left: false, down: false, up: false};

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
    let eframe_number = false; 
    let eframe_count = 0; 
    let player_direction = 0;
    let enemy_direction = 0; 
    let px = 16, py = 16; 
    let ex = -56, ey = 123; 
    const IMG_SIDE = 16; 
    let points = 0
    const animation = timestamp => {
        
        // INITIALIZE ANIMATION
        frame_count++; 
        eframe_count++; 
        render.clearRect(0, 0, w, h); 
        render.fillRect(w / 2, h / 2, u, u); 
        render.save(); 
        render.fillStyle = '#046'; 
        render.fillRect(0, 0, w, h); 
        render.translate(-Math.floor(px / U_SCALE) * w, -Math.floor(py / U_SCALE) * h); 
        
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

        for (var key in emovement) {
            if (emovement.hasOwnProperty(key)) {     
                if(Math.random() <= .01){
                    emovement[key] = !emovement[key]
                }   
            }
        }

        let eleft = emovement.left, eright = emovement.right, eup = emovement.up, edown = emovement.down; 
        let evx = +eright - +eleft; 
        let evy = +edown - +eup; 
        if(eright || eup || eleft || edown) {
            enemy_direction = eright ? 1 : eup ? 2 : edown ? 3 : 0; 
            if(eframe_count % 10 == 0) {
                eframe_number = !eframe_number; 
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

            if(rigid_body.y <= ey + IMG_SIDE && ey < rigid_body.y + rigid_body.h) {
                if(ex + IMG_SIDE <= rigid_body.x && rigid_body.x < ex + IMG_SIDE + evx) {
                    evx = 0; 
                    ex = rigid_body.x - IMG_SIDE; 
                    emovement.right = false
                }
                if(rigid_body.x + rigid_body.w <= ex && ex + evx < rigid_body.x + rigid_body.w) {
                    evx = 0; 
                    ex = rigid_body.x + rigid_body.w; 
                    emovement.left = false
                }
            }
            if(rigid_body.x <= ex + IMG_SIDE && ex <= rigid_body.x + rigid_body.w) {
                if(ey + IMG_SIDE <= rigid_body.y && rigid_body.y < ey + IMG_SIDE + evy) {
                    evy = 0; 
                    ey = rigid_body.y - IMG_SIDE; 
                    emovement.down = false
                }
                if(rigid_body.y + rigid_body.h <= ey && ey + evy < rigid_body.y + rigid_body.h) {
                    evy = 0; 
                    ey = rigid_body.y + rigid_body.h; 
                    emovement.up = false
                }
            }
        }); 
        px += pvx; 
        py += pvy; 
        ex += evx; 
        ey += evy;

        let distance = Math.sqrt(Math.pow((px+IMG_SIDE/2)-(ex+IMG_SIDE/2),2)+Math.pow((py+IMG_SIDE/2)-(ey+IMG_SIDE/2),2))
        if(distance <= IMG_SIDE){
            ex = Math.floor(Math.random() * (238 - -126) ) + -126
            ey = Math.floor(Math.random() * (238 - -126) ) + -126
            points++
        }
        
        // RENDER DYNAMIC OBJECTS
        render.fillStyle = '#052'; 
        rigid_bodies.forEach(rigid_body => {
            render.fillRect(rigid_body.x * u, rigid_body.y * u, rigid_body.w * u, rigid_body.h * u); 
        }); 
        render.drawImage(player_avatar, +frame_number * IMG_SIDE, player_direction * IMG_SIDE, IMG_SIDE, IMG_SIDE, px * u, py * u, IMG_SIDE * u, IMG_SIDE * u); 
        render.drawImage(enemy_avatar, +eframe_number * IMG_SIDE, enemy_direction * IMG_SIDE, IMG_SIDE, IMG_SIDE, ex * u, ey * u, IMG_SIDE * u, IMG_SIDE * u); 

        render.restore();
        render.fillStyle = '#b00'
        render.font = "bold 30px Arial";
        render.fillText(`${points} TAGS`, 16, 40);
        window.requestAnimationFrame(animation); 
    }; 
    window.requestAnimationFrame(animation); 
}); 