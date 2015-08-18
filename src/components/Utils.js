var Utils = {};
/**
 * Draw the collision boxes for debug.
 */
Utils.drawCollisionBoxes = function (canvasCtx, tRexBox, obstacleBox) {
    canvasCtx.save();
    canvasCtx.strokeStyle = '#f00';
    canvasCtx.strokeRect(tRexBox.x, tRexBox.y,
        tRexBox.width, tRexBox.height);
    canvasCtx.strokeStyle = '#0f0';
    canvasCtx.strokeRect(obstacleBox.x, obstacleBox.y,
        obstacleBox.width, obstacleBox.height);
    canvasCtx.restore();
};

/**
 * Get random number.
 * @param {number} min
 * @param {number} max
 * @param {number}
 */
Utils.getRandomNum = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Decodes the base 64 audio to ArrayBuffer used by Web Audio.
 * @param {string} base64String
 */
Utils.decodeBase64ToArrayBuffer = function (base64String) {
    var len = (base64String.length / 4) * 3;
    var str = atob(base64String);
    var arrayBuffer = new ArrayBuffer(len);
    var bytes = new Uint8Array(arrayBuffer);

    for (var i = 0; i < len; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes.buffer;
}

module.exports = Utils;