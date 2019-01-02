const init = function(){
    const createWhiteNoise = function(audioContext) {
        var bufferSize = 2 * audioContext.sampleRate,
        noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate),
        output = noiseBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        var whiteNoise = audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.start(0);

        return whiteNoise;
    }

    const createSine = function(audioContext) {
        const osc = audioContext.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 440;
        osc.start(0);
        return osc;
    }

    const audioContext = new AudioContext();

    const osc = createSine(audioContext);
    const oscNoise = createWhiteNoise(audioContext);

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    osc.connect(gainNode);
    oscNoise.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const fadeIn = function(){
        return new Promise(function(resolve, reject) {
            gainNode.gain.exponentialRampToValueAtTime(1, audioContext.currentTime + 0.1)
            setTimeout(resolve, 100)
        })
    }

    const fadeOut = function(){
        return new Promise(function(resolve, reject) {
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 2)
            setTimeout(resolve, 2000)
        })
    }

    const hold = function(){
        return new Promise(function(resolve, reject) {
            setTimeout(resolve, 500)
        })
    }

    document.getElementById("play").onclick = function() {
        osc.frequency.value = document.getElementById("frequency").value;
        fadeIn().then(hold).then(fadeOut);
    }
}
