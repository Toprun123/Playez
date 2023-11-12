import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

var prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);

const camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera2.position.set(0, 1, 50);
camera2.lookAt(new THREE.Vector3(0, 0, 0));

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.classList.add("canvas");
document.getElementById("game-container").appendChild(renderer.domElement);

scene.background = new THREE.Color(0xffffff);

const light1 = new THREE.HemisphereLight(0xeeeeff, 0x777788, 2);
light1.position.set(-10, 10, -10);
scene.add(light1);

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

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

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

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

const loader = new GLTFLoader();

let city, char;

function colliding(object1, object2) {
    return new THREE.Box3().setFromObject(object1).intersectsBox(new THREE.Box3().setFromObject(object2));
}

function animate() {
	requestAnimationFrame(animate);
    const time = performance.now();
    if (controls.isLocked === true) {
        char.position.copy(controls.getObject().position.x, controls.getObject().position.y + 10, controls.getObject().position.z);
        const onObject = colliding(char, city);
        console.log(onObject);
        const delta = (time - prevTime) / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta;
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;
        if (onObject === true) {
            velocity.y = Math.max(0, velocity.y);
            let box = new THREE.Box3().setFromObject(city);
            controls.getObject().position.y = city.position.y + (box.max.y - box.min.y)/2 + 10;
            canJump = true;
        }
        canJump = true;
        controls.moveRight(- velocity.x * delta);
        controls.moveForward(- velocity.z * delta);
        controls.getObject().position.y += (velocity.y * delta);
    }
    if (controls.getObject().position.y < 0) {
        velocity.y = 0;
        controls.getObject().position.y = 0;
        canJump = true;
    }
    prevTime = time;
	renderer.render(scene, camera);
}

loader.load('static/playez/3d_models/char1.glb', function (gltf_p) {
    const geometry = new THREE.BoxGeometry(1000, 1, 1000);
    const material = new THREE.MeshBasicMaterial({color: 0x000000}); 
    const cube = new THREE.Mesh(geometry, material);
    cube.position.y = -0.5;
    city = cube;
    scene.add(city);
    const geometry2 = new THREE.BoxGeometry(5, 10, 5);
    const material2 = new THREE.MeshBasicMaterial({color: 0x00ff00 , transparent: true, opacity: 0}); 
    const cube2 = new THREE.Mesh(geometry2, material2);
    char = cube2;
    scene.add(char);
    animate();
}, undefined, function (e) {
	console.error(e);
});


