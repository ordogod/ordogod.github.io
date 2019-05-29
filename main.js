"use strict";

//==================== CONSTANTS ====================//

const raycastingButton = document.getElementById("raycasting");
const renderingButton = document.getElementById("rendering");

const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

const cWidth = canvas.width;
const cHeight = canvas.height;

const tick = Math.round(1000 / 60);

const RAYCASTER_RADIUS = 5;

const RAYS_COUNT = 360 * 4;
const RAYS_STROKE_WIDTH = 1;
const RAYS_STROKE_COLOR = "#f0f8ff30";

const BORDERS_STROKE_WIDTH = 2;
const BORDERS_STROKE_COLOR = "#f0f8ff";

const PLAYER_VIEW_ANGLE = 60;
const PLAYER_RAYS_PER_DEGREE = 2;
const PLAYER_SIZE = 12;
const PLAYER_ROTATION_SPEED = 10;
const PLAYER_MOVE_SPEED = 10;

var mode = 0;

const renderingSize = {
    width: cWidth / 2,
    height: cHeight
};

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

class Raycaster {

    constructor() {
        this.pos = new Vector(0, 0);
        this.rays = [];

        this.rays = Raycaster.makeRaysSet(RAYS_COUNT, new Vector(0, 0));
    }

    static makeRaysSet(raysCount = RAYS_COUNT, pos, startDegree, endDegree) {

        let rays = [];

        if (startDegree === undefined && endDegree === undefined) { // then make rays at whole circumference
            for (let i = 0; i < 360; i += 360 / raysCount) {
                rays.push(
                    new Ray(
                        pos,
                        new Vector(
                            Math.cos(Calc.fromDegsToRads(i)),
                            Math.sin(Calc.fromDegsToRads(i))
                        )
                    )
                );
            }
        }

        else {
            let arcDegree = Math.abs(startDegree - endDegree);
            for (let i = startDegree; i < endDegree; i += arcDegree / raysCount) {
                rays.push(
                    new Ray(
                        pos,
                        new Vector(
                            Math.cos(Calc.fromDegsToRads(i)),
                            Math.sin(Calc.fromDegsToRads(i))
                        )
                    )
                );
            }
        }

        return rays;
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
        c.arc(this.pos.x, this.pos.y, RAYCASTER_RADIUS, 0, 2 * Math.PI);
        c.fill();
    }
}

class Player {

    constructor(viewAngle = PLAYER_VIEW_ANGLE) {
        this.viewAngle = viewAngle;
        this.pos = new Vector(100, 100);
        this.rotationDegree = 0;
        this.rays = this.updateRays();
    }

    updateRays() {
        return Raycaster.makeRaysSet(
            PLAYER_VIEW_ANGLE * PLAYER_RAYS_PER_DEGREE,
            this.pos,
            this.rotationDegree - PLAYER_VIEW_ANGLE / 2,
            this.rotationDegree + PLAYER_VIEW_ANGLE / 2
        );
    }

    updateRaysPos() {
        for (let i = 0; i < this.rays.length; i++) {
            this.rays[i].pos.x = this.pos.x;
            this.rays[i].pos.y = this.pos.y;
        }
    }

    turnLeft() {
        player.rotationDegree = (player.rotationDegree - PLAYER_ROTATION_SPEED) % 360;
        this.rays = this.updateRays();
        console.log('left');
    }

    turnRight() {
        player.rotationDegree = (player.rotationDegree + PLAYER_ROTATION_SPEED) % 360;
        this.rays = this.updateRays();
        console.log('right');
    }

    moveForward() {
        player.pos = new Vector(
            player.pos.x + Math.cos(Calc.fromDegsToRads(player.rotationDegree)) * PLAYER_MOVE_SPEED,
            player.pos.y + Math.sin(Calc.fromDegsToRads(player.rotationDegree)) * PLAYER_MOVE_SPEED
        );
        this.updateRaysPos();
        console.log('forward');
    }

    getPos() {
        return this.pos;
    }

    draw() {
        c.fillStyle = "#f0f8ff";
        c.beginPath();
        c.save();
        c.translate(this.pos.x, this.pos.y);
        c.moveTo(
            Math.cos(Calc.fromDegsToRads(this.rotationDegree + 90)) * PLAYER_SIZE,
            Math.sin(Calc.fromDegsToRads(this.rotationDegree + 90)) * PLAYER_SIZE
        );
        c.lineTo(
            2 * Math.cos(Calc.fromDegsToRads(this.rotationDegree)) * PLAYER_SIZE,
            2 * Math.sin(Calc.fromDegsToRads(this.rotationDegree)) * PLAYER_SIZE
        );
        c.lineTo(
            Math.cos(Calc.fromDegsToRads(this.rotationDegree - 90)) * PLAYER_SIZE,
            Math.sin(Calc.fromDegsToRads(this.rotationDegree - 90)) * PLAYER_SIZE
        );
        c.lineTo(
            Math.cos(Calc.fromDegsToRads(this.rotationDegree + 90)) * PLAYER_SIZE,
            Math.sin(Calc.fromDegsToRads(this.rotationDegree + 90)) * PLAYER_SIZE
        );
        c.fill();
        c.restore();
    }
}


class Ray {

    constructor(vectorPos, vectorDirection) {
        this.pos = vectorPos;
        this.dir = vectorDirection;
    }

    static updatePos(rays, pos) {
        for (let i = 0; i < rays.length; i++) {
            rays[i].pos.x = pos.x;
            rays[i].pos.y = pos.y;
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

    static drawAll(rays, colliders) {
        c.lineWidth = RAYS_STROKE_WIDTH;
        c.strokeStyle = RAYS_STROKE_COLOR;
        c.beginPath();

        let borders = [];
        for (let i = 0; i < colliders.length; i++) {
            if (colliders[i] instanceof Border)
                borders.push(colliders[i]);
            else { // if instance of Wall
                for (let j = 0; j < colliders[i].borders.length; j++) {
                    borders.push(colliders[i].borders[j]);
                }
            }
        }

        let closestCollisionPoint;
        let currentCollisionPoint;

        for (let i = 0; i < rays.length; i++) { // for rays

            closestCollisionPoint = null;

            for (let j = 0; j < borders.length; j++) { // for colliders

                currentCollisionPoint = rays[i].cast(borders[j]); // false or Vector

                if (currentCollisionPoint) { // if collision detected

                    if (closestCollisionPoint === null) {
                        closestCollisionPoint = new Vector();
                        Vector.copyVector(closestCollisionPoint, currentCollisionPoint);
                    }
                    else if (Calc.distance(rays[i], currentCollisionPoint) < Calc.distance(rays[i], closestCollisionPoint)) {
                        Vector.copyVector(closestCollisionPoint, currentCollisionPoint);
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

    constructor(corners, isFilled) { // gets all corners of wall colliders
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

//==================== PREPARATION AND LOOPS ====================//

var raycastingInterval;
var renderingInterval;

canvas.addEventListener("mousemove", updateCurrentMouseCoords, false);

raycastingButton.addEventListener("click", () => {
    if (!isElementSelected(raycastingButton)) {
        setElementSelectedClass(raycastingButton, renderingButton);
        clearInterval(renderingInterval);
        raycastingInterval = setInterval(raycastingLoop, tick);
        mode = 0;
    }
});

renderingButton.addEventListener("click", () => {
    if (!isElementSelected(renderingButton)) {
        setElementSelectedClass(renderingButton, raycastingButton);
        clearInterval(raycastingInterval);
        renderingInterval = setInterval(renderingLoop, tick);
        mode = 1;
    }
});

document.addEventListener("keydown", event => {
    event = event || window.event;

    if (mode === 1) {
        if (event.key === 'a') player.turnLeft();
        if (event.key === 'd') player.turnRight();
        if (event.key === 'w') player.moveForward();
    }
});

const raycaster = new Raycaster();
const colliders = [
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

const player = new Player(PLAYER_VIEW_ANGLE);
const walls = [
    new Wall([
        new Vector(0, 0),
        new Vector(renderingSize.width, 0),
        new Vector(renderingSize.width, renderingSize.height),
        new Vector(0, renderingSize.height)
    ], false)
];

raycastingInterval = setInterval(raycastingLoop, tick);

//==================== FUNCTIONS ====================//

function raycastingLoop() {

    prepareCanvas();

    raycaster.updatePos();
    raycaster.draw();

    Border.drawAll(colliders);

    Ray.updatePos(raycaster.rays, raycaster.getPos());
    Ray.drawAll(raycaster.rays, colliders);
}

function renderingLoop() {

    prepareCanvas();

    player.draw();

    Border.drawAll(walls);

    Ray.updatePos(player.rays, player.getPos());
    Ray.drawAll(player.rays, walls);
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

function isElementSelected(elem) {
     return getElementIndex(elem.className.split(' '), 'selected') !== -1;

}

function setElementSelectedClass(elemToSet, elemSelected) {
    elemToSet.className += ' selected';
    elemSelected.className = elemSelected.className.split(' ')[0];
}
