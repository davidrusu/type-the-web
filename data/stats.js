let BURST_TIME = 10; // burst wpm time interval in seconds
let WORD_LENGTH = 5; // chars per word

self.port.on("ttw-stats-updated", (hudStats) => {
    console.log(hudStats);
    var timeSec = hudStats.timeSoFar / 1000;
    var numCharsBurst = hudStats.keysBurst.length;
    var burstwpm = Math.floor(numCharsBurst / WORD_LENGTH / BURST_TIME * 60);
    var wpm = Math.floor(
        hudStats.keysTyped / WORD_LENGTH / timeSec * 60 - hudStats.errorsTyped / WORD_LENGTH);
    var wordsTyped = Math.floor(hudStats.keysTyped / 5);
//    var text =
//        "<div id='ttw-hud'>\
//           <div class='ttw-hud-stat'>\
//               <div class='ttw-inline' id='ttw-hud-num'>"+wordsTyped+"</div>\
//               <div class='ttw-hud-text'>words typed</div>\
//           </div>\
//           <div class='ttw-hud-stat'>\
//               <div class='ttw-inline' id='ttw-hud-num'>"+hudStats.errorsTyped+"</div>\
//               <div class='ttw-hud-text'>errors</div>\
//           </div>\
//           <div class='ttw-hud-stat'>\
//               <div class='ttw-inline' id='ttw-hud-num'>"+burstwpm+"</div>\
//               <div class='ttw-hud-text'>burst wpm</div>\
//           </div>\
//           <div class='ttw-hud-stat'>\
//               <div class='ttw-inline' id='ttw-hud-num'>"+wpm+"</div>\
//               <div class='ttw-hud-text'>wpm</div>\
//           </div>\
//        </div>";
    $('#words').text(wordsTyped);
    $('#errors').text(hudStats.errorsTyped);
    $('#burst').text(burstwpm);
    $('#wpm').text(wpm);
    //$("#ttw-stats").html(text);
});
