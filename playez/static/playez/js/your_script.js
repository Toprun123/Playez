// Import the necessary modules
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Initialize variables for time, velocity, direction, and movement
var prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

// Create a new scene
const scene = new THREE.Scene();

// Create the first camera and set its position
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);

// Create the second camera and set its position and target
const camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera2.position.set(0, 1, 50);
camera2.lookAt(new THREE.Vector3(0, 0, 0));

// Create a WebGL renderer and append it to the game container
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.classList.add("canvas");
document.getElementById("game-container").appendChild(renderer.domElement);

// Set the scene background color
scene.background = new THREE.Color(0xffffff);

// Create a hemisphere light and set its position
const light1 = new THREE.HemisphereLight(0xeeeeff, 0x777788, 2);
light1.position.set(-10, 10, -10);
scene.add(light1);

// Create pointer lock controls and add event listeners for lock and unlock
const controls = new PointerLockControls(camera, document.body);

document.getElementById('menu').addEventListener('click', function () {
    controls.lock();
});

controls.addEventListener('lock', function () {
    menu.style.animation = 'out 0.25s forwards';
});

controls.addEventListener('unlock', function () {
    menu.style.animation = 'in 0.25s forwards';
});

// Add a window resize event listener to adjust the camera aspect ratio and update the renderer size
window.addEventListener('resize', onWindowResize);

/**
 * Handles the window resize event by adjusting the camera aspect ratio and updating the renderer size.
 */
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Handles the keydown event and updates the movement state based on the pressed keys.
 *
 * @param {Event} e - the keydown event object
 * @return {void} 
 */
const onKeyDown = function (e) {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump === true) velocity.y += 350;
            canJump = false;
            break;
    }
};

/**
 * Handles the key up event and updates the movement based on the released key.
 *
 * @param {Event} e - the key up event object
 * @return {void} 
 */
const onKeyUp = function (e) {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
};

// Add event listeners for keydown and keyup events
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Create a GLTF loader instance
const loader = new GLTFLoader();

let city, char;

/**
 * Checks if the bounding boxes of two objects are colliding.
 *
 * @param {Object3D} obj1 - The first object
 * @param {Object3D} obj2 - The second object
 * @return {boolean} Whether the bounding boxes are colliding
 */
function colliding(obj1, obj2) {
    const box1 = new THREE.Box3().setFromObject(obj1);
    const box2 = new THREE.Box3().setFromObject(obj2);
    return box1.intersectsBox(box2);
}

/**
 * Function to animate the scene and update the controls based on user input.
 */
function animate() {
    // Request the next animation frame
    requestAnimationFrame(animate);

    // Get the current time
    const time = performance.now();

    // Check if the controls are locked
    if (controls.isLocked) {
        // Get the character position
        const charPos = controls.getObject().position;

        // Update the character position
        char.position.copy(charPos.x, charPos.y + 10, charPos.z);

        // Check for collisions with the city
        const onObject = colliding(char, city);

        // Calculate time delta
        const delta = (time - prevTime) / 1000;

        // Apply physics to the character
        applyPhysics(delta);

        // Update character movement based on user input
        updateMovement(delta);

        // Handle collisions with the city
        handleCityCollisions(onObject);

        // Move the controls based on velocity
        moveControls(delta);
    }

    // Handle ground collisions
    handleGroundCollisions();

    // Update the previous time
    prevTime = time;

    // Render the scene
    renderer.render(scene, camera);
}

/**
 * Function to apply physics to the character based on time delta.
 * @param {number} delta - The time delta.
 */
function applyPhysics(delta) {
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta;
}

/**
 * Function to update character movement based on user input and time delta.
 * @param {number} delta - The time delta.
 */
function updateMovement(delta) {
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;
}

/**
 * Function to handle collisions with the city based on the collision status.
 * @param {boolean} onObject - The collision status.
 */
function handleCityCollisions(onObject) {
    if (onObject) {
        velocity.y = Math.max(0, velocity.y);
        let box = new THREE.Box3().setFromObject(city);
        controls.getObject().position.y = city.position.y + (box.max.y - box.min.y)/2 + 10;
        canJump = true;
    }
}

/**
 * Function to move the controls based on velocity and time delta.
 * @param {number} delta - The time delta.
 */
function moveControls(delta) {
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    controls.getObject().position.y += velocity.y * delta;
}

/**
 * Function to handle ground collisions and reset character position if needed.
 */
function handleGroundCollisions() {
    if (controls.getObject().position.y < 0) {
        velocity.y = 0;
        controls.getObject().position.y = 0;
        canJump = true;
    }
}

// Load the 3D model 'char1.glb' using the loader
loader.load('static/playez/3d_models/char1.glb', function (gltf_p) {
    // Create a box geometry for the city
    const geometry = new THREE.BoxGeometry(1000, 1, 1000);
    // Create a basic material with color for the city
    const material = new THREE.MeshBasicMaterial({color: 0x000000}); 
    // Create a mesh with the geometry and material
    const cube = new THREE.Mesh(geometry, material);
    // Set the y position of the cube
    cube.position.y = -0.5;
    // Set the city as the cube
    city = cube;
    // Add the city to the scene
    scene.add(city);
    // Create a box geometry for the character
    const geometry2 = new THREE.BoxGeometry(5, 10, 5);
    // Create a basic material with color, transparency, and opacity for the character
    const material2 = new THREE.MeshBasicMaterial({color: 0x00ff00 , transparent: true, opacity: 0}); 
    // Create a mesh with the geometry and material
    const cube2 = new THREE.Mesh(geometry2, material2);
    // Set the character as the cube
    char = cube2;
    // Add the character to the scene
    scene.add(char);
    // Start the animation
    animate();
}, undefined, function (e) {
    console.error(e);
});


/* 

var xhr = new XMLHttpRequest();
    xhr.open('POST', 'gamepi', true);
    xhr.setRequestHeader('X-CSRFToken', csrf_token);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
        }
    }
    xhr.send("type=delete_game&game_id=9");

*/
