var data = {
    labels: [],
    datasets: [
        {
            label: "Errors",
            strokeColor: "rgba(230, 30, 30, 1)",
            data: []
        },
        {
            label: "Burst WPM",
            strokeColor: "rgba(230, 120, 30, 1)",
            data: []
        }
    ]
};
$(document).on('ready', () => {
    Chart.defaults.global = {
        // Boolean - Whether to animate the chart
        animation: false,

        // Number - Number of animation steps
        animationSteps: 0,

        // String - Animation easing effect
        animationEasing: "easeOutQuart",

        // Boolean - If we should show the scale at all
        showScale: true,

        // Boolean - If we want to override with a hard coded scale
        scaleOverride: false,

        // ** Required if scaleOverride is true **
        // Number - The number of steps in a hard coded scale
        scaleSteps: null,
        // Number - The value jump in the hard coded scale
        scaleStepWidth: null,
        // Number - The scale starting value
        scaleStartValue: null,

        // String - Colour of the scale line
        scaleLineColor: "rgba(0,0,0,.1)",

        // Number - Pixel width of the scale line
        scaleLineWidth: 1,

        // Boolean - Whether to show labels on the scale
        scaleShowLabels: true,

        // Interpolated JS string - can access value
        scaleLabel: "<%=value%>",

        // Boolean - Whether the scale should stick to integers, not floats even if drawing space is there
        scaleIntegersOnly: true,

        // Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
        scaleBeginAtZero: false,

        // String - Scale label font declaration for the scale label
        scaleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

        // Number - Scale label font size in pixels
        scaleFontSize: 12,

        // String - Scale label font weight style
        scaleFontStyle: "normal",

        // String - Scale label font colour
        scaleFontColor: "#666",

        // Boolean - whether or not the chart should be responsive and resize when the browser does.
        responsive: true,

        // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
        maintainAspectRatio: true,

        // Boolean - Determines whether to draw tooltips on the canvas or not
        showTooltips: false,

        // Array - Array of string names to attach tooltip events
        tooltipEvents: [],

        // String - Tooltip background colour
        tooltipFillColor: "rgba(0,0,0,0.8)",

        // String - Tooltip label font declaration for the scale label
        tooltipFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

        // Number - Tooltip label font size in pixels
        tooltipFontSize: 14,

        // String - Tooltip font weight style
        tooltipFontStyle: "normal",

        // String - Tooltip label font colour
        tooltipFontColor: "#fff",

        // String - Tooltip title font declaration for the scale label
        tooltipTitleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

        // Number - Tooltip title font size in pixels
        tooltipTitleFontSize: 14,

        // String - Tooltip title font weight style
        tooltipTitleFontStyle: "bold",

        // String - Tooltip title font colour
        tooltipTitleFontColor: "#fff",

        // Number - pixel width of padding around tooltip text
        tooltipYPadding: 6,

        // Number - pixel width of padding around tooltip text
        tooltipXPadding: 6,

        // Number - Size of the caret on the tooltip
        tooltipCaretSize: 8,

        // Number - Pixel radius of the tooltip border
        tooltipCornerRadius: 6,

        // Number - Pixel offset from point x to tooltip edge
        tooltipXOffset: 10,

        // String - Template string for single tooltips
        tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>",

        // String - Template string for single tooltips
        multiTooltipTemplate: "<%= value %>",

        // Function - Will fire on animation progression.
        onAnimationProgress: function(){},

        // Function - Will fire on animation completion.
        onAnimationComplete: function(){}
    };
                               
    
    var ctx = document.getElementById("wpm-chart").getContext("2d");
    var wpmChart = new Chart(ctx).Line(data, {
        bezierCurve: false,
        pointDot: false,
        datasetFill: false
    });

    addon.port.on("stop", () => {
        // we disable the buttons to avoid any confusion because the
        // stats panel will remain active but the typing test is done
        $("#ttw-stop-button").attr("disabled", "disabled");
        $("#ttw-skip-button").attr("disabled", "disabled");
    });
    var lastUpdateTime = 0;
    addon.port.on("stats-updated", (hudStats) => {
        var timeSec = hudStats.timeSoFar / 1000; // time is in millis
        var burstwpm = Math.floor(
            hudStats.keysBurst.length / CONSTANTS.WORD_LENGTH / CONSTANTS.BURST_TIME * 60);
        var wpm = Math.floor(
            hudStats.keysTyped / CONSTANTS.WORD_LENGTH / timeSec * 60 - hudStats.errorsTyped / CONSTANTS.WORD_LENGTH);
        $('#errors').text(hudStats.errorsTyped);
        $('#burst').text(burstwpm);
        $('#wpm').text(wpm);
        if (timeSec - lastUpdateTime > 1) {
            wpmChart.addData(
                [hudStats.errorsTyped, burstwpm], timeSec );
            wpmChart.update();
            lastUpdateTime = timeSec;
        }
    });
});
