
var sendLastUpdateTime = 0;
const minInterval = 100;

function moveToPosition(model, targetPosition) {
    if (Math.abs(model.position.x - targetPosition.x) > 0.5 || Math.abs(model.position.z - targetPosition.z) > 0.5) {
        animateLegs(model)
    } else {
        stopLegs(model)
    }
    new TWEEN.Tween(model.position)
        .to(targetPosition, minInterval)
        .easing(TWEEN.Easing.Linear.None)
        .start();
}

function stopLegs(model) {
    new TWEEN.Tween(model.getObjectByName("LeftLeg").rotation)
        .to({ x: 0 }, minInterval)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    // Create tween for right leg rotation
    new TWEEN.Tween(model.getObjectByName("RightLeg").rotation)
        .to({ x: 0 }, minInterval)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
}

function animateLegs(model) {
    rotationAngle = -rotationAngle
    // Create tween for left leg rotation
    new TWEEN.Tween(model.getObjectByName("LeftLeg").rotation)
        .to({ x: rotationAngle, y: 0, z: 0 }, minInterval)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    // Create tween for right leg rotation
    new TWEEN.Tween(model.getObjectByName("RightLeg").rotation)
        .to({ x: -rotationAngle, y: 0, z: 0 }, minInterval)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
}

function rotateBody(model, rotation, sk_type) {
    var correctionQuat = new THREE.Quaternion();
    var axis = new THREE.Vector3(0, 1, 0);
    var angle = Math.PI;
    correctionQuat.setFromAxisAngle(axis, angle);
    if (sk_type == "s") {
        rotation = new THREE.Quaternion(-rotation[0], rotation[1], -rotation[2], rotation[3]);
        rotation.multiply(correctionQuat);
    } else if (sk_type == "m") {
        rotation = new THREE.Quaternion(...rotation);
    } else if (sk_type == "j") {

    }
    var newYQuaternion = new THREE.Quaternion();
    newYQuaternion.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.atan2(
            2 * (rotation._y * rotation._w + rotation._x * rotation._z),
            1 - 2 * (rotation._y * rotation._y + rotation._x * rotation._x)
        )
    );
    var newXZQuaternion = new THREE.Quaternion(rotation._x, 0, rotation._z, rotation._w);
    new TWEEN.Tween(model.getObjectByName("Head").quaternion)
        .to(newXZQuaternion, minInterval)
        .easing(TWEEN.Easing.Linear.None)
        .start();
    new TWEEN.Tween(model.quaternion)
        .to(newYQuaternion, minInterval)
        .easing(TWEEN.Easing.Linear.None)
        .start();
}

function jump() {
    // TWEEN Here!!!
}

// Update Player Position and Velocity from Server Data
function updatePlayerFromServer(playerData) {
    Object.entries(playerData).forEach(([player_tmp, data])=>{
        const skin = data.skin;
        if (skin != "") {
            if ((!players[player_tmp])) {
                // If not, load the player model
                loadModel(skin)
                    .then(model => {
                        // Store the model reference
                        players[player_tmp] = model;
                        // Add the model to the scene
                        moveToPosition(players[player_tmp], data.position);
                        rotateBody(players[player_tmp], data.rotation, skin[0]);
                        scene.add(model);
                    })
                    .catch(error => {
                        console.error('An error occurred while loading the player model:', error);
                    });
            } else {
                // If the player already exists, update its position and velocity
                moveToPosition(players[player_tmp], data.position);
                rotateBody(players[player_tmp], data.rotation, skin[0]);
            }
        }
    });
    Object.keys(players).forEach(playerName => {
        if (!Object.keys(playerData).find(player_tmp => player_tmp == playerName)) {
            const model = players[playerName];
            // Remove the model from the scene
            scene.remove(model);
            // Dispose of the model to release memory
            model.traverse(node => {
                if (node.isMesh) {
                    node.geometry.dispose();
                    node.material.dispose();
                }
            });
            // Remove the player from the players object
            delete players[playerName];
        }
    });
}
