$("#ttw-stop-button").click((e) => self.port.emit('stop'));

$("#ttw-skip-button").click((e) => {
    self.port.emit('skip');
    // We need to blur the button, because it will remain focused
    // after being clicked and pressing space will push the button. 
    $('#ttw-skip-button').blur(); 
});

self.port.on("stop", () => {
    // we disable the buttons to avoid any confusion because the
    // stats panel will remain active but the typing test is done
    $("#ttw-stop-button").attr("disabled", "disabled");
    $("#ttw-skip-button").attr("disabled", "disabled");
});

self.port.on("ttw-stats-updated", (hudStats) => {
    var timeSec = hudStats.timeSoFar / 1000; // time is in millis
    var burstwpm = Math.floor(
        hudStats.keysBurst.length / CONSTANTS.WORD_LENGTH / CONSTANTS.BURST_TIME * 60);
    var wpm = Math.floor(
        hudStats.keysTyped / CONSTANTS.WORD_LENGTH / timeSec * 60 - hudStats.errorsTyped / CONSTANTS.WORD_LENGTH);
    $('#errors').text(hudStats.errorsTyped);
    $('#burst').text(burstwpm);
    $('#wpm').text(wpm);
});
