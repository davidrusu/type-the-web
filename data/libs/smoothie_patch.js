SmoothieChart.prototype.render = function(canvas, time) {
    var nowMillis = new Date().getTime();

    if (!this.isAnimatingScale) {
        // We're not animating. We can use the last render time and the scroll speed to work out whether
        // we actually need to paint anything yet. If not, we can return immediately.

        // Render at least every 1/6th of a second. The canvas may be resized, which there is
        // no reliable way to detect.
        var maxIdleMillis = Math.min(1000/6, this.options.millisPerPixel);

        if (nowMillis - this.lastRenderTimeMillis < maxIdleMillis) {
            return;
        }
    }

    this.resize();

    this.lastRenderTimeMillis = nowMillis;

    canvas = canvas || this.canvas;
    time = time || nowMillis - (this.delay || 0);

    // Round time down to pixel granularity, so motion appears smoother.
    time -= time % this.options.millisPerPixel;

    var context = canvas.getContext('2d'),
        chartOptions = this.options,
        dimensions = { top: 0, left: 0, width: canvas.clientWidth, height: canvas.clientHeight },
        // Calculate the threshold time for the oldest data points.
        oldestValidTime = time - (dimensions.width * chartOptions.millisPerPixel),
        valueToYPixel = function(value) {
            var offset = value - this.currentVisMinValue;
            return this.currentValueRange === 0
                ? dimensions.height
                : dimensions.height - (Math.round((offset / this.currentValueRange) * dimensions.height));
        }.bind(this),
        timeToXPixel = function(t) {
            if(chartOptions.scrollBackwards) {
                return Math.round((time - t) / chartOptions.millisPerPixel);
            }
            return Math.round(dimensions.width - ((time - t) / chartOptions.millisPerPixel));
        };

    this.updateValueRange();

    context.font = chartOptions.labels.fontSize + 'px ' + chartOptions.labels.fontFamily;

    // Save the state of the canvas context, any transformations applied in this method
    // will get removed from the stack at the end of this method when .restore() is called.
    context.save();

    // Move the origin.
    context.translate(dimensions.left, dimensions.top);

    // Create a clipped rectangle - anything we draw will be constrained to this rectangle.
    // This prevents the occasional pixels from curves near the edges overrunning and creating
    // screen cheese (that phrase should need no explanation).
    context.beginPath();
    context.rect(0, 0, dimensions.width, dimensions.height);
    context.clip();

    // Clear the working area.
    context.save();
    context.fillStyle = chartOptions.grid.fillStyle;
    context.clearRect(0, 0, dimensions.width, dimensions.height);
    context.fillRect(0, 0, dimensions.width, dimensions.height);
    context.restore();

    // Grid lines...
    context.save();
    context.lineWidth = chartOptions.grid.lineWidth;
    context.strokeStyle = chartOptions.grid.strokeStyle;
    // Vertical (time) dividers.
    //if (chartOptions.grid.millisPerLine > 0) {
    //  context.beginPath();
    //  for (var t = time - (time % chartOptions.grid.millisPerLine);
    //       t >= oldestValidTime;
    //       t -= chartOptions.grid.millisPerLine) {
    //    var gx = timeToXPixel(t);
    //    if (chartOptions.grid.sharpLines) {
    //      gx -= 0.5;
    //    }
    //    context.moveTo(gx, 0);
    //    context.lineTo(gx, dimensions.height);
    //  }
    //  context.stroke();
    //  context.closePath();
    //}

    // Horizontal (value) dividers.
    for (var v = 1; v < chartOptions.grid.verticalSections; v++) {
        var gy = Math.round(v * dimensions.height / chartOptions.grid.verticalSections);
        if (chartOptions.grid.sharpLines) {
            gy -= 0.5;
        }
        context.beginPath();
        context.moveTo(0, gy);
        context.lineTo(dimensions.width, gy);
        context.stroke();
        context.closePath();
    }
    // Bounding rectangle.
    if (chartOptions.grid.borderVisible) {
        context.beginPath();
        context.strokeRect(0, 0, dimensions.width, dimensions.height);
        context.closePath();
    }
    context.restore();

    // Draw any horizontal lines...
    if (chartOptions.horizontalLines && chartOptions.horizontalLines.length) {
        for (var hl = 0; hl < chartOptions.horizontalLines.length; hl++) {
            var line = chartOptions.horizontalLines[hl],
                hly = Math.round(valueToYPixel(line.value)) - 0.5;
            context.strokeStyle = line.color || '#ffffff';
            context.lineWidth = line.lineWidth || 1;
            context.beginPath();
            context.moveTo(0, hly);
            context.lineTo(dimensions.width, hly);
            context.stroke();
            context.closePath();
        }
    }

    // For each data set...
    for (var d = 0; d < this.seriesSet.length; d++) {
        context.save();
        var timeSeries = this.seriesSet[d].timeSeries,
            dataSet = timeSeries.data,
            seriesOptions = this.seriesSet[d].options;

        // Delete old data that's moved off the left of the chart.
        timeSeries.dropOldData(oldestValidTime, chartOptions.maxDataSetLength);

        // Set style for this dataSet.
        context.lineWidth = seriesOptions.lineWidth;
        context.strokeStyle = seriesOptions.strokeStyle;
        // Draw the line...
        context.beginPath();
        // Retain lastX, lastY for calculating the control points of bezier curves.
        var firstX = 0, lastX = 0, lastY = 0;
        for (var i = 0; i < dataSet.length && dataSet.length !== 1; i++) {
            var x = timeToXPixel(dataSet[i][0]),
                y = valueToYPixel(dataSet[i][1]);

            if (i === 0) {
                firstX = x;
                context.moveTo(x, y);
            } else {
                switch (chartOptions.interpolation) {
                case "linear":
                case "line": {
                    context.lineTo(x,y);
                    break;
                }
                case "bezier":
                default: {
                    // Great explanation of Bezier curves: http://en.wikipedia.org/wiki/Bezier_curve#Quadratic_curves
                    //
                    // Assuming A was the last point in the line plotted and B is the new point,
                    // we draw a curve with control points P and Q as below.
                    //
                    // A---P
                    //     |
                    //     |
                    //     |
                    //     Q---B
                    //
                    // Importantly, A and P are at the same y coordinate, as are B and Q. This is
                    // so adjacent curves appear to flow as one.
                    //
                    context.bezierCurveTo( // startPoint (A) is implicit from last iteration of loop
                        Math.round((lastX + x) / 2), lastY, // controlPoint1 (P)
                        Math.round((lastX + x)) / 2, y, // controlPoint2 (Q)
                        x, y); // endPoint (B)
                    break;
                }
                case "step": {
                    context.lineTo(x,lastY);
                    context.lineTo(x,y);
                    break;
                }
                }
            }

            lastX = x; lastY = y;
        }

        if (dataSet.length > 1) {
            if (seriesOptions.fillStyle) {
                // Close up the fill region.
                context.lineTo(dimensions.width + seriesOptions.lineWidth + 1, lastY);
                context.lineTo(dimensions.width + seriesOptions.lineWidth + 1, dimensions.height + seriesOptions.lineWidth + 1);
                context.lineTo(firstX, dimensions.height + seriesOptions.lineWidth);
                context.fillStyle = seriesOptions.fillStyle;
                context.fill();
            }

            if (seriesOptions.strokeStyle && seriesOptions.strokeStyle !== 'none') {
                context.stroke();
            }
            context.closePath();
        }
        context.restore();
    }

    if (!chartOptions.labels.disabled &&  !isNaN(this.valueRange.min) && !isNaN(this.valueRange.max)) {
        context.fillStyle = chartOptions.labels.fillStyle;
        var maxValue = this.valueRange.max;
        var minValue = this.valueRange.min;
        var maxValueString = Math.floor(maxValue);
        var minValueString = Math.floor(minValue);
        var numSections = chartOptions.grid.verticalSections;
        var deltaValue = (maxValue-minValue) / numSections;
        var deltaValueString = "";
        context.fillText(maxValueString, dimensions.width - context.measureText(maxValueString).width - 2, chartOptions.labels.fontSize);
        for (var i = 1; i < numSections; i++) {
            deltaValueString = Math.floor(maxValue -i*deltaValue);
            context.fillText(deltaValueString,
                             dimensions.width - context.measureText(deltaValueString).width - 2,
                             Math.floor(dimensions.height*i/numSections + chartOptions.labels.fontSize/2));
        }
        context.fillText(minValueString, dimensions.width - context.measureText(minValueString).width - 2, dimensions.height - 2);
    }

    // Display timestamps along x-axis at the bottom of the chart.
    if (chartOptions.timestampFormatter && chartOptions.grid.millisPerLine > 0) {
        var textUntilX = chartOptions.scrollBackwards
                ? context.measureText(minValueString).width
                : dimensions.width - context.measureText(minValueString).width + 4;
        for (var t = time - (time % chartOptions.grid.millisPerLine);
             t >= oldestValidTime;
             t -= chartOptions.grid.millisPerLine) {
            var gx = timeToXPixel(t);
            // Only draw the timestamp if it won't overlap with the previously drawn one.
            if ((!chartOptions.scrollBackwards && gx < textUntilX) || (chartOptions.scrollBackwards && gx > textUntilX))  {
                // Formats the timestamp based on user specified formatting function
                // SmoothieChart.timeFormatter function above is one such formatting option
                var tx = new Date(t),
                    ts = chartOptions.timestampFormatter(tx),
                    tsWidth = context.measureText(ts).width;

                textUntilX = chartOptions.scrollBackwards
                    ? gx + tsWidth + 2
                    : gx - tsWidth - 2;

                context.fillStyle = chartOptions.labels.fillStyle;
                if(chartOptions.scrollBackwards) {
                    context.fillText(ts, gx, dimensions.height - 2);
                } else {
                    context.fillText(ts, gx - tsWidth, dimensions.height - 2);
                }
            }
        }
    }

    context.restore(); // See .save() above.
}
