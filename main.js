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
const PLAYER_RAYS_PER_DEGREE = 20;
const PLAYER_RADIUS = 12;
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

const WALLS_RANDOM_SIZE = {
    min: 1,
    max: Math.round(renderingSize.width * 0.7)
};

//==================== CLASSES ====================//

class Calc {
    static fromDegsToRads(degrees) {
        return degrees * Math.PI / 180;
    }

    static distance(from, to) {
        if (from instanceof Ray) from = new Vector(from.pos.x, from.pos.y);
        if (to instanceof Ray) to = new Vector(to.pos.x, to.pos.y);

        return Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
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
        let newPos = new Vector(
            player.pos.x + Math.cos(Calc.fromDegsToRads(player.rotationDegree)) * PLAYER_MOVE_SPEED,
            player.pos.y + Math.sin(Calc.fromDegsToRads(player.rotationDegree)) * PLAYER_MOVE_SPEED
        );

        let dist;
        let minDist = Infinity;
        let dirRay = this.rays[Math.round(this.rays.length / 2)];
        let cp;
        let borders = Border.getRawBordersArr(walls);

        for (let i = 0; i < borders.length; i++) {
            cp = dirRay.cast(borders[i]);
            if (cp) {
                dist = Calc.distance(dirRay.pos, cp);
                if (dist < minDist) minDist = dist;
            }
        }

        if (minDist >= 2 * PLAYER_RADIUS) {
            this.pos = newPos;
            this.updateRaysPos();
            console.log('forward');
        }
    }

    getPos() {
        return this.pos;
    }

    draw() {
            c.fillStyle = "#f0f8ff";
            c.beginPath();
            c.arc(this.pos.x, this.pos.y, PLAYER_RADIUS, 0, 2 * Math.PI);
            c.fill();
    }
}


class Ray {

    constructor(pos, dir) {
        this.pos = pos;
        this.dir = dir;
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
            return new Vector( // collision point of ray and border
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

        let borders = Border.getRawBordersArr(colliders);

        let closestCP;
        let cp;

        for (let i = 0; i < rays.length; i++) { // for rays

            closestCP = null;

            for (let j = 0; j < borders.length; j++) { // for colliders

                cp = rays[i].cast(borders[j]); // false or Vector

                if (cp) { // if collision detected

                    if (closestCP === null) {
                        closestCP = new Vector();
                        Vector.copyVector(closestCP, cp);
                    }
                    else if (Calc.distance(rays[i], cp) < Calc.distance(rays[i], closestCP)) {
                        Vector.copyVector(closestCP, cp);
                    }
                }
            }

            c.moveTo(rays[i].pos.x, rays[i].pos.y);
            c.lineTo(closestCP.x, closestCP.y);
        }

        c.stroke();
    }
}

class Border {

    constructor(start, end) {
        this.start = start;
        this.end = end;
    }

    static getRawBordersArr(colliders) {
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

        return borders;
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

    static randomRectangleWall(isFilled) {
        let corners = [];
        let size = {
            width: Math.round(WALLS_RANDOM_SIZE.min + (Math.random() * Math.abs(WALLS_RANDOM_SIZE.max - WALLS_RANDOM_SIZE.min))),
            height: Math.round(WALLS_RANDOM_SIZE.min + (Math.random() * Math.abs(WALLS_RANDOM_SIZE.max - WALLS_RANDOM_SIZE.min))),
        };

        corners[0] = new Vector(Infinity, Infinity);

        while(corners[0].x + size.width > renderingSize.width ||
              corners[0].y + size.height > renderingSize.height) {
            corners[0] = new Vector(
                Math.round(Math.random() * renderingSize.width),
                Math.round(Math.random() * renderingSize.height)
            );
        }

        corners[1] = new Vector(
            corners[0].x + size.width,
            corners[0].y
        );
        corners[2] = new Vector(
            corners[0].x + size.width,
            corners[0].y + size.height
        );
        corners[3] = new Vector(
            corners[0].x,
            corners[0].y + size.height
        );

        return new Wall(corners, isFilled);
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

class FirstPersonDrawer {

    constructor() {

    }

    draw() {

        let borders = Border.getRawBordersArr(walls);

        let cp;
        let closestCP;
        let dist;
        let maxDist = Math.sqrt(Math.pow(renderingSize.width, 2) + Math.pow(renderingSize.height, 2));

        let yOff;
        let alpha;
        let height;
        let width = renderingSize.width / player.rays.length;

        for (let i = 0; i < player.rays.length; i++) { // for rays

            closestCP = null;

            for (let j = 0; j < borders.length; j++) {
                cp = player.rays[i].cast(borders[j]);
                if (cp) {
                    if (closestCP === null) {
                        closestCP = new Vector();
                        Vector.copyVector(closestCP, cp);
                    } else if (Calc.distance(player.rays[i], cp) < Calc.distance(player.rays[i], closestCP)) {
                        Vector.copyVector(closestCP, cp);
                    }
                }
            }

            dist = Calc.distance(player.rays[i].pos, closestCP);
            height = renderingSize.height / (dist / (2 * PLAYER_RADIUS));
            yOff = (renderingSize.height - height) / 2;


            alpha = 255 - (255 / maxDist * (dist - PLAYER_RADIUS));
            if (alpha === Infinity || alpha > 255) alpha = 'ff';
            else alpha = Math.round(alpha).toString(16);
            if (alpha.length === 1) alpha = '0' + alpha;

            c.fillStyle = "#" + alpha + alpha + alpha + alpha;
            c.fillRect(renderingSize.width + i * width, yOff, width, height);

        }
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
    ], false),
    Wall.randomRectangleWall(true),
    Wall.randomRectangleWall(true),
    Wall.randomRectangleWall(true)
];
const fpd = new FirstPersonDrawer();

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

    fpd.draw();
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
