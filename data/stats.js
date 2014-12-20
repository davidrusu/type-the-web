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
    var timeSec = hudStats.timeSoFar / 1000;
    var numCharsBurst = hudStats.keysBurst.length;
    var burstwpm = Math.floor(numCharsBurst / CONSTANTS.WORD_LENGTH / CONSTANTS.BURST_TIME * 60);
    var wpm = Math.floor(
        hudStats.keysTyped / CONSTANTS.WORD_LENGTH / timeSec * 60 - hudStats.errorsTyped / CONSTANTS.WORD_LENGTH);
    var wordsTyped = Math.floor(hudStats.keysTyped / 5);
    $('#errors').text(hudStats.errorsTyped);
    $('#burst').text(burstwpm);
    $('#wpm').text(wpm);
});

$(document).keypress((e) => {
    switch(e.key) {
    case "Esc":
        self.port.emit('stop');
        e.preventDefault();
        return;
    }
});
