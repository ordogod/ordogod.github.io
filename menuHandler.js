"use strict";

alert("Use mouse to move at raycasting screen.\nUse W A S D to move at rendering screen.");

let raysRange = document.getElementById("rays-per-degree-slider");
let angleRange = document.getElementById("view-angle-slider");

let raysSpan = document.getElementById("rays-per-degree-span");
let angleSpan = document.getElementById("view-angle-span");

let angleItem = document.getElementById("angle-item");

angleItem.style.display = "none";

raysRange.oninput = () => {
    raysSpan.innerHTML = raysRange.value;
    if (mode === 0) {
        RAYCASTER_RAYS_PER_DEGREE = raysRange.value;
        raycaster.updateRays()
    }
    else {
        PLAYER_RAYS_PER_DEGREE = raysRange.value;
        player.updateRays();
    }
};

angleRange.oninput = () => {
    angleSpan.innerHTML = angleRange.value;
    PLAYER_VIEW_ANGLE = angleRange.value;
    player.updateRays();
};

