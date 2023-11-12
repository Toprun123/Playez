import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

var gltf_sc;
var cam_g;
const scene = new THREE.Scene();
const loader = new GLTFLoader();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5); // Set the camera position to the origin initially
const camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera2.position.set(0, 70, 30); // Set the camera position to the origin initially
camera2.rotation.x = -50 * Math.PI / 180

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("game-container").appendChild(renderer.domElement);

const light1 = new THREE.DirectionalLight( 0xffffff, 5 );
light1.position.set( -10, 10, -10 );
scene.add( light1 );
const light2 = new THREE.AmbientLight( 0xffffff, 5 );
//light2.position.set( 10, 10, 10 );
scene.add( light2 );

const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

scene.background = new THREE.Color(0x404040);

var pMBD = false;
var lockM = false;
var h_x = 0;
var h_y = 0;
var keyPressed = null;
var jump_pos = 0;
var jump_bool = false;
var jump_speed = 0;

document.addEventListener('keydown', (e) => {
  keyPressed = e.key;
})

document.addEventListener('keyup', (e) => {
  keyPressed = null;
})

function sPBS(e) {
  var flags = e.buttons !== undefined ? e.buttons : e.button;
  pMBD = (flags & 1) === 1;
}

document.addEventListener("mousedown", sPBS);
document.addEventListener("mousemove", sPBS);
document.addEventListener("mouseup", sPBS);

document.addEventListener("pointerlockchange", lockChangeAlert, false);

function lockChangeAlert() {
  if (document.pointerLockElement === renderer.domElement) {
    lockM = true;
    document.addEventListener("mousemove", updatePosition, false);
  } else {
    lockM = false;
    document.removeEventListener("mousemove", updatePosition, false);
  }
}

function updatePosition(e) {
  var movementX = e.movementX ||
      e.mozMovementX          ||
      e.webkitMovementX       ||
      0;

  var movementY = e.movementY ||
      e.mozMovementY      ||
      e.webkitMovementY   ||
      0;
  let val_x = h_x - movementY/3;
  h_x = (val_x > -45) ? ((val_x < 90) ? val_x : 90) : -45;
  h_x = movementY/3;
  console.log(movementY)
  h_y -= movementX/3;
}

function updateControl() {
  if (pMBD) {
    if (!document.pointerLockElement) {
      renderer.domElement.requestPointerLock();
    }
  }
  if (lockM) {
    var axis = new THREE.Vector3(1,0,0);
    cam_g.rotateOnAxis(axis, h_x);
    //cam_g.rotation.y = h_y * Math.PI / 180;
  }
  if (keyPressed == 'W' || keyPressed == 'w'){
    cam_g.translateZ( -0.1 );
  } else if (keyPressed == 'S' || keyPressed == 's') {
    cam_g.translateZ( +0.1 );
  } else if (keyPressed == 'A' || keyPressed == 'a') {
    cam_g.translateX( -0.1 );
  } else if (keyPressed == 'D' || keyPressed == 'd') {
    cam_g.translateX( +0.1 );
  } else if (keyPressed == ' ') {
    jump_pos = +0.000001;
  }
  if (jump_pos < 0.3) {
    jump_speed = 0.8;
  } else if (jump_pos < 0.6*4) {
    jump_speed = 0.4;
  } else if (jump_pos < 0.8*4) {
    jump_speed = 0.2;
  } else if (jump_pos < 0.9*4) {
    jump_speed = 0.1;
  }
  if (jump_pos != 0) {
    cam_g.position.y = jump_pos ;
    if (jump_bool) {
      jump_pos -= jump_speed;
    } else {
      jump_pos += jump_speed;
    }
    if (jump_pos > 4) {
      jump_bool = true;
    } else if (jump_pos < 0) {
      jump_pos = 0;
      jump_bool = false;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  updateControl();
  
  renderer.render(scene, camera);
}

loader.load( 'static/playez/3d_models/playground.glb', function ( gltf_p ) {
  gltf_p.scene.position.y = -7;
  scene.add(gltf_p.scene);
  loader.load( 'static/playez/3d_models/AK47.glb', function ( gltf ) {
    gltf_sc = gltf.scene;
    gltf_sc.position.set(2, -3, 0);
    cam_g = new THREE.Group();
    cam_g.add( gltf_sc );
    cam_g.add( camera );
    scene.add(cam_g);
    animate();
  }, undefined, function ( error ) {
    console.error( error );
  } );  
}, undefined, function ( error ) {
	console.error( error );
} );
