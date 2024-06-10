import * as TWEEN from 'tween';

var canvas = document.getElementById("canvas");
var engine = new BABYLON.Engine(canvas, true);

Math.radToDeg = r => r * 180 / Math.PI;
Math.degToRad = d => d * Math.PI / 180;
Math.map = (n, min, max, omin, omax)=>(n-min)*(omax-omin)/(max-min)+omin;

const models_info = JSON.parse(await (await fetch('static/playez/json/models_info.json')).text());
const minInterval = 100;

async function loadPlayerModel(type, scene) {
    return new Promise((resolve, reject) => {
        BABYLON.SceneLoader.Append(
            "static/playez/3d_models/player/"+type+"/", "scene.gltf",
            scene, loadedScene => resolve(loadedScene), null,
            (_, message, exception) => reject(exception || new Error(message))
        );
    });
}

async function loadWeapons(scene) {
    return new Promise((resolve, reject) => {
        BABYLON.SceneLoader.Append(
            "static/playez/3d_models/weapons/", "final.glb",
            scene, loadedScene => resolve(loadedScene), null,
            (_, message, exception) => reject(exception || new Error(message))
        );
    });
}

function clearRoot(scene) {
    var rootNode = scene.getMeshByName("__root__");
    if (rootNode) rootNode.dispose();
}

async function loadWeapon(weapon, scene) {
    // Remove existing gun "Gun" if exists
    var gunNode = scene.activeCamera.getChildren();
    if (gunNode.length>0) gunNode.forEach(c=>c.dispose());
    await loadWeapons(scene);
    var gunMeshes = scene.getMeshByName("__root__").getChildren().find(c=>c.name==weapon).getChildren();
    if (weapon[1] == "o") { // "Rocket_launcher"
        var rocketNodes = scene.getMeshByName("__root__").getChildren().find(c=>c.name=="Rocket").getChildren();
        var rocket = new BABYLON.TransformNode("Rocket", scene);
        rocketNodes.forEach(node => node.parent = rocket);
        rocket.parent = scene.activeCamera;
        rocket.scaling = new BABYLON.Vector3(...models_info["weapons"][weapon]["scaling"]);
        rocket.position = new BABYLON.Vector3(...models_info["weapons"][weapon]["position"]);
        rocket.rotation = new BABYLON.Vector3(...(models_info["weapons"][weapon]["rotation"].map(Math.degToRad)));
    }
    var gun = new BABYLON.TransformNode("Gun", scene);
    gunMeshes.forEach(mesh => mesh.parent = gun);
    gun.parent = scene.activeCamera;
    gun.scaling = new BABYLON.Vector3(...models_info["weapons"][weapon]["scaling"]);
    gun.position = new BABYLON.Vector3(...models_info["weapons"][weapon]["position"]);
    gun.rotation = new BABYLON.Vector3(...(models_info["weapons"][weapon]["rotation"].map(Math.degToRad)));
    clearRoot(scene);
}

var rotationAngle = Math.degToRad(75);
var animationCount = 0;

function moveToPosition(model, pos) {
    if (Math.abs(model.position.x - pos.x) > 0.2 || Math.abs(model.position.z - pos.z) > 0.2) animateLimbs(model);
    else stopLimbs(model);
    new TWEEN.Tween(model.position)
        .to({ x: pos.x, y: pos.y+0.35, z: pos.z }, 100)
        .easing(TWEEN.Easing.Linear.None).start();
}

function stopLimbs(model) {
    new TWEEN.Tween(model.getChildren().find(c=>c.name=="LeftLeg").rotation)
        .to({ x: 0, z: Math.degToRad(4) }, minInterval)
        .easing(TWEEN.Easing.Linear.None)
        .start();
    new TWEEN.Tween(model.getChildren().find(c=>c.name=="RightLeg").rotation)
        .to({ x: 0, z: Math.degToRad(-4) }, minInterval)
        .easing(TWEEN.Easing.Linear.None)
        .start();
    new TWEEN.Tween(model.getChildren().find(c=>c.name=="RightArm").rotation)
        .to({ x: 0, z: Math.degToRad(-4) }, minInterval*2)
        .easing(TWEEN.Easing.Linear.None)
        .start();
    new TWEEN.Tween(model.getChildren().find(c=>c.name=="LeftArm").rotation)
        .to({ x: 0, z: Math.degToRad(4) }, minInterval*2)
        .easing(TWEEN.Easing.Linear.None)
        .start();
}

function animateLimbs(model) {
    if (animationCount%2==0) {
        rotationAngle = -rotationAngle;
        new TWEEN.Tween(model.getChildren().find(c=>c.name=="LeftLeg").rotation)
            .to({ x: rotationAngle, y: 0, z: Math.degToRad(4) }, minInterval*2)
            .easing(TWEEN.Easing.Linear.None)
            .start();
        new TWEEN.Tween(model.getChildren().find(c=>c.name=="RightLeg").rotation)
            .to({ x: -rotationAngle, y: 0, z: Math.degToRad(-4) }, minInterval*2)
            .easing(TWEEN.Easing.Linear.None)
            .start();
        new TWEEN.Tween(model.getChildren().find(c=>c.name=="RightArm").rotation)
            .to({ x: rotationAngle, y: 0, z: Math.degToRad(-4) }, minInterval*2)
            .easing(TWEEN.Easing.Linear.None)
            .start();
        new TWEEN.Tween(model.getChildren().find(c=>c.name=="LeftArm").rotation)
            .to({ x: -rotationAngle, y: 0, z: Math.degToRad(4) }, minInterval*2)
            .easing(TWEEN.Easing.Linear.None)
            .start();
    }
    animationCount++;
}

// Create a scene
var createScene = async () => {
    var scene = new BABYLON.Scene(engine);
    // Enable Physics Engine
    var cannonPlugin = new BABYLON.CannonJSPlugin();
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), cannonPlugin);
    var hdrTexture = new BABYLON.CubeTexture.CreateFromPrefilteredData("static/playez/3d_models/sky-16bit-512.dds", scene);
    scene.environmentTexture = hdrTexture;
    // Optional: Adjust the environment texture intensity
    scene.environmentIntensity = 1.0;
    // Ground
    var ground = BABYLON.Mesh.CreateGround("ground", 1000, 1000, 1, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.PlaneImpostor, { mass: 0, restitution: 0 }, scene);
    // Lighting
    // Create a hemispherical light
    var hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(0, 1, 0), scene);
    // Set light properties
    hemisphericLight.diffuse = new BABYLON.Color3(1, 1, 1); // Set the diffuse color of the light
    hemisphericLight.specular = new BABYLON.Color3(0, 0, 0); // Set the specular color of the light
    hemisphericLight.groundColor = new BABYLON.Color3(0, 0, 1); // Set the ground color (optional)
    // Ambient Light
    var ambientLight = new BABYLON.PointLight("ambientLight", new BABYLON.Vector3.Zero(), scene);
    // Set light properties
    ambientLight.diffuse = new BABYLON.Color3(1, 1, 1); // Set the diffuse color of the light
    ambientLight.specular = new BABYLON.Color3(0, 0, 0); // Set the specular color of the light
    ambientLight.intensity = 12;
    // A box
    var box = BABYLON.Mesh.CreateBox("box", 1, scene);
    var boxMaterial = new BABYLON.StandardMaterial("material", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3.FromHexString("#ff0000");
    box.position.y = 5;
    box.material = boxMaterial
    box.physicsImpostor = new BABYLON.PhysicsImpostor(box, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0 }, scene);
    // Create a FreeCamera
    var camera = new BABYLON.FreeCamera("default_camera", new BABYLON.Vector3.Zero(), scene);
    // Set camera speed
    camera.speed = 0.2;
    // Define Player Body
    var playerBody = BABYLON.MeshBuilder.CreateCylinder("cylinder", { height: 2, diameter: 0.9 }, scene);
    // Create a physics impostor with constraints
    playerBody.physicsImpostor = new BABYLON.PhysicsImpostor(playerBody, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 15, restitution: 0.3, friction: 0 }, scene);
    // Constrain rotations
    playerBody.visibility = 0;
    playerBody.physicsImpostor.executeNativeFunction((_, body) => {
        body.fixedRotation = true;
        body.updateMassProperties();
    });
    playerBody.position.y = 25;
    playerBody.position.x = -5;
    playerBody.position.z = -5;
    playerBody.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
    loadWeapon(weapon, scene);
    camera.parent = playerBody;
    camera.position.y = 1.7;
    function isOnGround() {
        var ray = new BABYLON.Ray(playerBody.position, new BABYLON.Vector3(0, -1, 0), 1.01);
        var pickInfo = scene.pickWithRay(ray, mesh => mesh != playerBody);
        return pickInfo.hit;
    }
    // Enable pointer lock
    var pointerLocked = false;
    var menu = document.getElementById("menu");
    var playerVelocity = BABYLON.Vector3.Zero();
    const keysPressed = {};
    var jumpImpulse = new BABYLON.Vector3(0, 100, 0);
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    menu.addEventListener("click", e => { if (!e.target.matches('.exclude')) canvas.requestPointerLock(); });
    document.addEventListener("pointerlockchange", _ => {
        pointerLocked = (document.pointerLockElement == canvas || document.mozPointerLockElement == canvas || document.webkitPointerLockElement == canvas);
        if (pointerLocked) menu.style.animation = 'out 0.25s forwards';
        else menu.style.animation = 'in 0.25s forwards';
    });
    canvas.addEventListener("mousemove", e => {
        var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        var movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
        camera.rotation.y += movementX / 500;
        camera.rotation.x += movementY / 500;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    });
    document.addEventListener("keydown", e => { if (!keysPressed[e.key] && pointerLocked) keysPressed[e.key] = true; });
    document.addEventListener("keyup", e => {
        keysPressed[e.key] = false;
        if (["w", "a", "s", "d"].includes(e.key) && pointerLocked) playerVelocity = BABYLON.Vector3.Zero();
    });
    var socket;
    var players = {};
    var lastUpdated = 0;
    document.getElementById('join_btn').addEventListener('click', _ => {
        code = document.getElementById("code_input").value;
        skin = document.getElementById("skin_input").value;
        weapon = document.getElementById("weapon_input").value;
        if (socket && socket.readyState == WebSocket.OPEN) socket.close();
        loadWeapon(weapon, scene);
        socket = new WebSocket('ws://'+window.location.host+'/ws/playez3dgame/'+code+'/');
        socket.onmessage = async e => {
            var received_data = JSON.parse(e.data);
            for (const [player_name, data] of Object.entries(received_data)) {
                if (!players[player_name]) {
                    if (data.skin != "") {
                        var model = await loadPlayerModel(data.skin, scene);
                        players[player_name] = new BABYLON.TransformNode(player_name, scene);
                        for (const [part_name, ids] of Object.entries(models_info["players"][data.skin])) {
                            var meshes = ids.map(id => model.getMeshByName(id));
                            var partFinal = new BABYLON.TransformNode(part_name, scene);
                            meshes.forEach(mesh => {
                                mesh.setParent(partFinal);
                                mesh.setAbsolutePosition(new BABYLON.Vector3(0, -1, 0));
                                if (mesh.rotationQuaternion) mesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, 0, Math.degToRad(180));
                                else mesh.rotation = new BABYLON.Vector3(0, 0, Math.degToRad(180));
                            });
                            partFinal.parent = players[player_name];
                        }
                        var playerCylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", { height: 2, diameter: 0.9 }, scene);
                        playerCylinder.physicsImpostor = new BABYLON.PhysicsImpostor(
                            playerCylinder,
                            BABYLON.PhysicsImpostor.CylinderImpostor,
                            { mass: 0, restitution: 0.3, friction: 0 },
                            scene
                        );
                        playerCylinder.visibility = 0;
                        players[player_name].scaling = new BABYLON.Vector3(1.55, 1.55, 1.55);
                        playerCylinder.parent = players[player_name];
                        clearRoot(scene);
                        var parts = players[player_name].getChildren();
                        var leftLeg = parts.find(c=>c.name=="LeftLeg");
                        var rightLeg = parts.find(c=>c.name=="RightLeg");
                        var legsPivotPoint = new BABYLON.Vector3(0, -0.4, 0);
                        leftLeg.setPivotPoint(legsPivotPoint);
                        rightLeg.setPivotPoint(legsPivotPoint);
                        var armsPivotPoint = new BABYLON.Vector3(0, 0.4, 0);
                        var leftArm = parts.find(c=>c.name=="LeftArm");
                        var rightArm = parts.find(c=>c.name=="RightArm");
                        leftArm.setPivotPoint(armsPivotPoint);
                        rightArm.setPivotPoint(armsPivotPoint);
                        leftArm.getChildren().forEach(c=>c.position.x-=0.01);
                        rightArm.getChildren().forEach(c=>c.position.x+=0.01);
                        var head = parts.find(c=>c.name=="Head");
                        var headPivotPoint = new BABYLON.Vector3(0, 0.55, 0);
                        head.setPivotPoint(headPivotPoint);
                    }
                } else {
                    moveToPosition(players[player_name], data.position);
                    new TWEEN.Tween(players[player_name].rotation)
                        .to({ y: Math.degToRad(180)+data.rotation.y }, minInterval)
                        .easing(TWEEN.Easing.Linear.None).start();
                    var head = players[player_name].getChildren().find(c=>c.name=="Head");
                    var headRotation = { x: -Math.degToRad(Math.map(Math.radToDeg(data.rotation.x), -90, 90, -65, 65)) };
                    new TWEEN.Tween(head.rotation)
                        .to(headRotation, minInterval)
                        .easing(TWEEN.Easing.Linear.None).start();
                }
            }
            Object.keys(players).forEach(player_name => {
                if (!Object.keys(received_data).find(player_tmp => player_tmp == player_name)) {
                    players[player_name].dispose();
                    delete players[player_name];
                }
            });
        };
        socket.onclose = _ => console.log('Game disconnected!');
    });
    document.getElementById('leave_btn').addEventListener('click', _ => {
        if (socket && socket.readyState === WebSocket.OPEN) socket.close();
        Object.keys(players).forEach(player_name => {
            players[player_name].dispose();
            delete players[player_name];
        });
        code = 0;
    });
    scene.registerBeforeRender(() => {
        var forward = camera.getDirection(BABYLON.Axis.Z);
        forward.y = 0;
        forward.normalize();
        var right = BABYLON.Vector3.Cross(forward, BABYLON.Axis.Y);
        right.y = 0;
        right.normalize();
        var playerAcceleration = 2.5;
        if (isOnGround()) playerAcceleration *= 4;
        if (keysPressed["w"]) playerVelocity = forward.scale(playerAcceleration);
        if (keysPressed["a"]) playerVelocity = right.scale(playerAcceleration);
        if (keysPressed["s"]) playerVelocity = forward.scale(-playerAcceleration);
        if (keysPressed["d"]) playerVelocity = right.scale(-playerAcceleration);
        if (keysPressed[" "] && isOnGround()) playerBody.physicsImpostor.applyImpulse(jumpImpulse, playerBody.getAbsolutePosition());
        // Update player position based on velocity
        var currentVelocity = playerBody.physicsImpostor.getLinearVelocity();
        playerBody.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(playerVelocity.x, currentVelocity.y, playerVelocity.z));
        var now = Date.now();
        if (now - lastUpdated >= minInterval) {
            lastUpdated = now;
            // Send playerdata to server
            const playerData = {  skin: skin, weapon: weapon,
                                position: { x: playerBody.position.x,
                                            y: playerBody.position.y,
                                            z: playerBody.position.z  },
                                rotation: { x: camera.rotation.x,
                                            y: camera.rotation.y,
                                            z: camera.rotation.z  }   };
            if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(playerData));
        }
        TWEEN.update();
    });
    document.getElementById("debugger").addEventListener('click', _ => BABYLON.Inspector.Show(scene));
    return scene;
};

createScene().then(scene => {
    // Run the render loop
    engine.runRenderLoop(() => scene.render());
    // Resize the Babylon engine when the window is resized
    window.addEventListener("resize", () => engine.resize());
});

