$(document).on('ready', () => {
    
    var canvas = document.getElementById("wpm-chart");
    var chartWidth = canvas.offsetWidth;
    var chartMillis = 1000*60 *5;
    var chart = new SmoothieChart({ millisPerPixel:chartMillis / chartWidth
                                  , interpolation:'bezier'
                                  , grid: { fillStyle:'#ffffff'
                                          , strokeStyle:'rgba(0,0,0,0.10)'
                                          , verticalSections:4
                                          , borderVisible:true }
                                  , labels: { fillStyle:'#777777'
                                            , fontSize:15
                                            , precision:0 }
                                  //, timestampFormatter: SmoothieChart.timeFormatter
                                  , minValue:0});

    var wpmSeries = new TimeSeries();
    var errorSeries = new TimeSeries();

    chart.addTimeSeries(wpmSeries, {lineWidth:2,strokeStyle:'#97e819'});
    chart.addTimeSeries(errorSeries, {lineWidth:2,strokeStyle:'#ffa819'});

    chart.streamTo(canvas, 0);

    addon.port.on("stop", () => {
        // we disable the buttons to avoid any confusion because the
        // stats panel will remain active but the typing test is done
        $("#ttw-stop-button").attr("disabled", "disabled");
        $("#ttw-skip-button").attr("disabled", "disabled");
    });
    var lastUpdateTime = 0;
    var numTicks = 0;
    addon.port.on("stats-updated", (hudStats) => {
        var timeSec = hudStats.timeSoFar / 1000; // time is in millis
        var burstwpm = 0;
        if (hudStats.keysBurst.length > 0) {
            burstwpm = Math.floor(
                hudStats.keysBurst.length / CONSTANTS.WORD_LENGTH / CONSTANTS.BURST_TIME * 60);
        }
        var bursterrors = 0;
        if (hudStats.errorsBurst.length > 0) {
            bursterrors = Math.floor(
                hudStats.errorsBurst.length / CONSTANTS.WORD_LENGTH / CONSTANTS.BURST_TIME * 60);
        }
        var wpm = Math.floor(
            (hudStats.keysTyped - hudStats.errorsTyped) / CONSTANTS.WORD_LENGTH / timeSec * 60);
        $('#errors').text(hudStats.errorsTyped);
        $('#burst').text(burstwpm);
        $('#wpm').text(wpm);

        wpmSeries.append(new Date().getTime(), burstwpm);
        errorSeries.append(new Date().getTime(), bursterrors);

        //if (timeSec - lastUpdateTime > 1) {
            //lastUpdateTime = timeSec;
	    //numTicks += 1;
	    //if (numTicks > 30) {
		//wpmChart.removeData();
		//numTicks -= 1;
	    //}
            //wpmChart.addData([bursterrors, burstwpm], '');
            //wpmChart.update();
        //}
    });
});
