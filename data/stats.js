let BURST_TIME = 10; // burst wpm time interval in seconds
let WORD_LENGTH = 5; // chars per word

let stopButtonHandler = (e) => {
    self.port.emit('stop');
};

let skipButtonHandler = (e) => {
    self.port.emit('skip');
    $('#ttw-skip-button').blur();
};

$("#ttw-stop-button").click(stopButtonHandler);
$("#ttw-skip-button").click(skipButtonHandler);

self.port.on("ttw-stats-updated", (hudStats) => {
    console.log(hudStats);
    var timeSec = hudStats.timeSoFar / 1000;
    var numCharsBurst = hudStats.keysBurst.length;
    var burstwpm = Math.floor(numCharsBurst / WORD_LENGTH / BURST_TIME * 60);
    var wpm = Math.floor(
        hudStats.keysTyped / WORD_LENGTH / timeSec * 60 - hudStats.errorsTyped / WORD_LENGTH);
    var wordsTyped = Math.floor(hudStats.keysTyped / 5);
    $('#words').text(wordsTyped);
    $('#errors').text(hudStats.errorsTyped);
    $('#burst').text(burstwpm);
    $('#wpm').text(wpm);
});
