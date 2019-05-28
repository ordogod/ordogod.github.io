"use strict";

//==================== CONSTANTS ====================//

const raycastingButton = document.getElementById("raycasting");
const renderingButton = document.getElementById("rendering");

const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

const cWidth = canvas.width;
const cHeight = canvas.height;

const tick = Math.round(1000 / 60);

const PLAYER_RADIUS = 5;

const RAYS_COUNT = 360 * 4;
const RAYS_STROKE_WIDTH = 1;
const RAYS_STROKE_COLOR = "#f0f8ff30";

const BORDERS_STROKE_WIDTH = 2;
const BORDERS_STROKE_COLOR = "#f0f8ff";

var modeSelected = 0;

const mouseCoords = {
    x: 0,
    y: 0
};

//==================== CLASSES ====================//

class Calc {
    static fromDegsToRads(degrees) {
        return degrees * Math.PI / 180;
    }

    static distance(vectorFrom, vectorTo) {
        if (vectorFrom instanceof Ray) vectorFrom = new Vector(vectorFrom.pos.x, vectorFrom.pos.y);
        if (vectorTo instanceof Ray) vectorTo = new Vector(vectorTo.pos.x, vectorTo.pos.y);

        return Math.sqrt(Math.pow(vectorTo.x - vectorFrom.x, 2) + Math.pow(vectorTo.y - vectorFrom.y, 2));
    }
}

class Vector {

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    static copyVector(to, from) {
        to.x = from.x;
        to.y = from.y;
    }
}

class Player {

    constructor() {
        this.pos = new Vector(0, 0);
        this.rays = [];

        for (let i = 0; i < 360; i += 360 / RAYS_COUNT) {
            this.rays.push(
                new Ray(
                    this.pos,
                    new Vector(
                        Math.cos(Calc.fromDegsToRads(i)),
                        Math.sin(Calc.fromDegsToRads(i))
                    )
                )
            );
        }
    }

    updatePos() {
        this.pos = mouseCoords;
    }

    getPos() {
        return this.pos;
    }

    draw() {
        c.fillStyle = "#f0f8ff";
        c.beginPath();
        c.arc(player.pos.x, player.pos.y, PLAYER_RADIUS, 0, 2 * Math.PI);
        c.fill();
    }
}


class Ray {

    constructor(vectorPos, vectorDirection) {
        this.pos = vectorPos;
        this.dir = vectorDirection;
    }

    static updatePos(rays) {
        for (let i = 0; i < rays.length; i++) {
            rays[i].pos = player.getPos();
        }
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

    static drawAll(rays) {
        c.lineWidth = RAYS_STROKE_WIDTH;
        c.strokeStyle = RAYS_STROKE_COLOR;
        c.beginPath();

        let closestCollisionPoint;
        let currentCollisionPoint;

        for (let i = 0; i < rays.length; i++) { // for rays

            closestCollisionPoint = null;

            for (let j = 0; j < borders.length; j++) { // for borders

                if (borders[j] instanceof Border) {

                    currentCollisionPoint = rays[i].cast(borders[j]);

                    if (currentCollisionPoint) { // if collision detected
                        if (closestCollisionPoint === null) { // if closes point of collision is null
                            // set it as current collision point
                            closestCollisionPoint = new Vector();
                            Vector.copyVector(closestCollisionPoint, currentCollisionPoint);
                        }
                        else {
                            if (Calc.distance(rays[i], currentCollisionPoint) < Calc.distance(rays[i], closestCollisionPoint)) {
                                Vector.copyVector(closestCollisionPoint, currentCollisionPoint);
                            }
                        }
                    }
                }

                if (borders[j] instanceof Wall) {
                    for (let k = 0; k < borders[j].borders.length; k++) { // for borders in the Wall

                        currentCollisionPoint = rays[i].cast(borders[j].borders[k]);

                        if (currentCollisionPoint) { // if collision detected
                            if (closestCollisionPoint === null) { // if closes point of collision is null
                                // set it as current collision point
                                closestCollisionPoint = new Vector();
                                Vector.copyVector(closestCollisionPoint, currentCollisionPoint);
                            }
                            else {
                                if (Calc.distance(rays[i], currentCollisionPoint) < Calc.distance(rays[i], closestCollisionPoint)) {
                                    Vector.copyVector(closestCollisionPoint, currentCollisionPoint);
                                }
                            }
                        }
                    }
                }
            }

            c.moveTo(rays[i].pos.x, rays[i].pos.y);
            c.lineTo(closestCollisionPoint.x, closestCollisionPoint.y);
        }

        c.stroke();
    }
}

class Border {

    constructor(vectorStart, vectorEnd) {
        this.start = vectorStart;
        this.end = vectorEnd;
    }

    static drawAll(borders) {
        c.lineWidth = BORDERS_STROKE_WIDTH;
        c.strokeStyle = BORDERS_STROKE_COLOR;

        for (let i = 0; i < borders.length; i++) {
            if (borders[i] instanceof Border) {
                c.beginPath();
                c.moveTo(borders[i].start.x, borders[i].start.y);
                c.lineTo(borders[i].end.x, borders[i].end.y);
                c.stroke();
            }
            if (borders[i] instanceof Wall) {
                borders[i].draw();
            }
        }
    }
}

class Wall {

    constructor(corners, isFilled) { // gets all corners of wall borders
        this.corners = corners;
        this.borders = [];
        this.filled = isFilled;

        for (let i = 0; i < corners.length - 1; i++) {
            this.borders.push(
                new Border(corners[i], corners[i + 1])
            );
        }

        this.borders.push(new Border(corners[corners.length - 1], corners[0]));
    }

    draw() {
        c.lineWidth = BORDERS_STROKE_WIDTH;
        c.strokeStyle = BORDERS_STROKE_COLOR;
        c.fillStyle = BORDERS_STROKE_COLOR;

        c.beginPath();
        c.moveTo(this.corners[0].x, this.corners[0].y);

        for (let i = 1; i < this.corners.length; i++) {
            c.lineTo(this.corners[i].x, this.corners[i].y);
        }

        c.lineTo(this.corners[0].x, this.corners[0].y); // encloses wall

        if (this.filled) c.fill();
        else c.stroke();
    }
}

//==================== PREPARATION AND LOOP ====================//

canvas.addEventListener("mousemove", updateCurrentMouseCoords, false);

raycastingButton.addEventListener("click", event => {
    if (getElementIndex(event.target.className.split(' '), 'selected') === -1) {
        event.target.className += ' selected';
    }
    modeSelected = 0;
    renderingButton.className = renderingButton.className.split(' ')[0];
});

renderingButton.addEventListener("click", event => {
    if (getElementIndex(event.target.className.split(' '), 'selected') === -1) {
        event.target.className += ' selected';
    }
    modeSelected = 1;
    raycastingButton.className = renderingButton.className.split(' ')[0];
});

const player = new Player();
const borders = [
    new Wall([
        new Vector(0, 0),
        new Vector(cWidth, 0),
        new Vector(cWidth, cHeight),
        new Vector(0, cHeight)
    ], false),
    new Border(
        new Vector(Math.random() * cWidth, Math.random() * cHeight),
        new Vector(Math.random() * cWidth, Math.random() * cHeight)
    ),
    new Border(
        new Vector(Math.random() * cWidth, Math.random() * cHeight),
        new Vector(Math.random() * cWidth, Math.random() * cHeight)
    ),
    new Border(
        new Vector(Math.random() * cWidth, Math.random() * cHeight),
        new Vector(Math.random() * cWidth, Math.random() * cHeight)
    ),
    new Border(
        new Vector(Math.random() * cWidth, Math.random() * cHeight),
        new Vector(Math.random() * cWidth, Math.random() * cHeight)
    )
];

setInterval(loop, tick);

//==================== FUNCTIONS ====================//

function loop() {

    prepareCanvas();

    player.updatePos();
    player.draw();

    Border.drawAll(borders);

    Ray.updatePos(player.rays);
    Ray.drawAll(player.rays);


}

function updateCurrentMouseCoords(p) {
    mouseCoords.x = p.pageX - canvas.offsetLeft;
    mouseCoords.y = p.pageY - canvas.offsetTop;
}

function prepareCanvas() {
    c.fillStyle = "#000000";
    c.fillRect(0, 0, cWidth, cHeight);
}

function getElementIndex(array, elem) {
    for (let i = 0; i < array.length; i++) {
        if (elem == array[i]) return i;
    }
    return -1;
}
