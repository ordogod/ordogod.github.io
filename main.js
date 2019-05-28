"use strict";

//==================== CONSTANTS ====================//

const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

const cWidth = canvas.width;
const cHeight = canvas.height;

const tick = Math.round(1000 / 60);

const PLAYER_RADIUS = 5;
const RAYS_COUNT = 20;

const mouseCoords = {
    x: 0,
    y: 0
};

//==================== CLASSES ====================//

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Player {

    constructor() {
        this.pos = new Vector(0, 0)
    }

    updatePos() {
        this.pos = mouseCoords;
    }

    getPos() { return this.pos; }

    draw() {
        c.strokeStyle = "#f0f8ff";
        c.beginPath();
        c.arc(player.pos.x, player.pos.y, PLAYER_RADIUS, 0, 2 * Math.PI);
        c.stroke();
    }
}


class Ray {

    constructor(vectorPos, vectorDirection) {
        this.pos = vectorPos;
        this.dir = vectorDirection;
    }

    updatePos() {
        this.pos = player.getPos();
    }

    cast(border) {
        const brdr = {
            start: border.start,
            end: border.end
        };

        const rayLine = {
            start: this.pos,
            end: new Vector(this.pos.x + this.dir.x, this.pos.y + this.dir.y)
        };

        const den = (brdr.start.x - brdr.end.x) * (rayLine.start.y - rayLine.end.y) -
            (brdr.start.y - brdr.end.y) * (rayLine.start.x - rayLine.end.x);

        if (den === 0) return false;

        const t = (
            (brdr.start.x - rayLine.start.x) * (rayLine.start.y - rayLine.end.y) -
            (brdr.start.y - rayLine.start.y) * (rayLine.start.x - rayLine.end.x)
        ) / den;

        const u = -(
            (brdr.start.x - brdr.end.x) * (brdr.start.y - rayLine.start.y) -
            (brdr.start.y - brdr.end.y) * (brdr.start.x - rayLine.start.x)
        ) / den;

        if (t > 0 && t < 1 && u > 0) { // point of collision exists
            return new Vector( // point of collision of ray and border
                brdr.start.x + t * (brdr.end.x - brdr.start.x),
                brdr.start.y + t * (brdr.end.y - brdr.start.y)
            );
        }

        return false;
    }

    draw() {
        c.strokeStyle = "#f0f8ff";

        c.save();
        c.translate(this.pos.x, this.pos.y);

        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(this.dir.x, this.dir.y);
        c.stroke();

        c.restore();
    }
}

class Border {

    constructor(vectorStart, vectorEnd) {
        this.start = vectorStart;
        this.end = vectorEnd;
    }

    draw() {
        c.strokeStyle = "#f0f8ff";
        c.beginPath();
        c.moveTo(this.start.x, this.start.y);
        c.lineTo(this.end.x, this.end.y);
        c.stroke();
    }
}

//==================== PREPARATION AND LOOP ====================//

canvas.addEventListener("mousemove", updateCurrentMouseCoords, false);

const player = new Player();
const border = new Border(new Vector(500, 100), new Vector(500, cHeight - 100));
const ray = new Ray(player.getPos(), new Vector(15, 0));

setInterval(loop, tick);

//==================== FUNCTIONS ====================//

function loop() {

    prepareCanvas();

    player.updatePos();
    player.draw();

    border.draw();

    ray.updatePos();
    ray.draw();

    let pt = ray.cast(border);
    if (pt) {
        c.strokeStyle = "#f0f8ff";
        c.beginPath();
        c.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
        c.stroke();
    }
}

function updateCurrentMouseCoords(p) {
    mouseCoords.x = p.pageX - canvas.offsetLeft;
    mouseCoords.y = p.pageY - canvas.offsetTop;
}

function prepareCanvas() {
    c.fillStyle = "#000000";
    c.fillRect(0, 0, cWidth, cHeight);
}
