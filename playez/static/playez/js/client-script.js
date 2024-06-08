import * as TWEEN from 'tween';

var canvas = document.getElementById("canvas");
var engine = new BABYLON.Engine(canvas, true);

Math.degrees = r => r * 180 / Math.PI;
Math.radians = d => d * Math.PI / 180;

async function loadModel(folder, type, scene) {
    return new Promise((resolve, reject) => {
        BABYLON.SceneLoader.Append(
            "static/playez/3d_models/"+folder+"/"+type+"/", "scene.gltf",
            scene, loadedScene => resolve(loadedScene), null,
            (_, message, exception) => reject(exception || new Error(message))
        );
    });
}

function clearRoot(scene) {
    let rootNode = scene.getMeshByName("__root__");
    if (rootNode) rootNode.dispose();
}

// Create a scene
var createScene = async () => {
    var scene = new BABYLON.Scene(engine);
    // Enable Physics Engine
    var cannonPlugin = new BABYLON.CannonJSPlugin();
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), cannonPlugin);
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
    var ambientLight = new BABYLON.PointLight("ambientLight", new BABYLON.Vector3(0, 0, 0), scene);
    // Set light properties
    ambientLight.diffuse = new BABYLON.Color3(1, 1, 1); // Set the diffuse color of the light
    ambientLight.specular = new BABYLON.Color3(0, 0, 0); // Set the specular color of the light
    ambientLight.intensity = 0.5;
    // A box
    var box = BABYLON.Mesh.CreateBox("box", 1, scene);
    var boxMaterial = new BABYLON.StandardMaterial("material", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3.FromHexString("#ff0000");
    box.position.y = 5;
    box.material = boxMaterial
    box.physicsImpostor = new BABYLON.PhysicsImpostor(box, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.2 }, scene);
    // Create a FreeCamera
    var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, 0), scene);
    // Set camera speed
    camera.speed = 0.2;
    // Define Player Body
    var playerBody = BABYLON.MeshBuilder.CreateCylinder("cylinder", { height: 2, diameter: 0.7 }, scene);
    // Create a physics impostor with constraints
    playerBody.physicsImpostor = new BABYLON.PhysicsImpostor(playerBody, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 15, restitution: 0.3, friction: 0 }, scene);
    // Constrain rotations
    playerBody.visible = false;
    playerBody.physicsImpostor.executeNativeFunction((_, body) => {
            body.fixedRotation = true;
            body.updateMassProperties();
    });
    playerBody.position.y = 10;
    playerBody.position.x = -5;
    playerBody.position.z = -5;
    playerBody.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
    var gunScene = await loadModel("weapons", "gun", scene);
    var gunMeshes = [gunScene.getMeshByName("Object_2"), gunScene.getMeshByName("Object_3")];
    var gun = BABYLON.Mesh.MergeMeshes(gunMeshes, true, false, null, false, true);
    gunMeshes.forEach(mesh => mesh.dispose());
    gun.parent = camera;
    gun.position.x = 0.8;
    gun.position.y = -0.4;
    gun.position.z = 2;
    gun.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
    gun.rotation.y = Math.radians(170);
    clearRoot(scene);
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
    menu.addEventListener("click", e => { if (canvas.requestPointerLock && !e.target.matches('.exclude')) canvas.requestPointerLock(); });
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
    var models_info = JSON.parse(await (await fetch('static/playez/js/models_info.json')).text());
    var players = {};
    const minInterval = 100;
    let lastUpdated = 0;
    document.getElementById('join_btn').addEventListener('click', _ => {
        code = document.getElementById("code_input").value;
        skin = document.getElementById("skin_input").value;
        weapon = document.getElementById("weapon_input").value;
        socket = new WebSocket('ws://'+window.location.host+'/ws/playez3dgame/'+code+'/');
        socket.onmessage = async e => {
            var received_data = JSON.parse(e.data);
            for (const [player_name, data] of Object.entries(received_data)) {
                if (!players[player_name]) {
                    if (data.skin != "") {
                        var model = await loadModel("player", data.skin, scene);
                        players[player_name] = new BABYLON.TransformNode(player_name, scene);
                        for (const [bodyPart, ids] of Object.entries(models_info["players"][data.skin])) {
                            var meshes = ids.map(id => model.getMeshByName(id));
                            var partFinal = new BABYLON.TransformNode(bodyPart, scene);
                            meshes.forEach(mesh => {
                                var temp_pos = mesh.getAbsolutePosition().clone();
                                mesh.setParent(partFinal);
                                mesh.setAbsolutePosition(temp_pos);
                            });
                            partFinal.parent = players[player_name];
                        }
                        clearRoot(scene);
                    }
                } else {
                    new TWEEN.Tween(players[player_name].position)
                        .to(data.position, minInterval)
                        .easing(TWEEN.Easing.Linear.None)
                        .start();
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
            var playerData = {  skin: skin, weapon: weapon,
                                position: { x: playerBody.position._x,
                                            y: playerBody.position._y,
                                            z: playerBody.position._z },
                                rotation: [ camera.rotation._x,
                                            camera.rotation._y,
                                            camera.rotation._z ]};
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

