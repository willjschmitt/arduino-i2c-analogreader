$(document).ready(function(){
	var dataPoints = [],
		chart;
	
	dataPoints.push({'key':'Boil Actual','values':[]});
	
	function getCookie(name) {
	    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
	    return r ? r[1] : undefined;
	}
	
	function postNew(){
		var newDataPoint = {
			time:new Date().toISOString(),
			value:Math.random(),
			sensor:1
		};
		$.post("/live/timeseries/new/", newDataPoint)
			.done(function(response) {window.setTimeout(postNew,1000);});
	}
	//postNew();

	var updater = {
	    errorSleepTime: 500,
	    cursor: null,

	    poll: function() {
	        var args = {"_xsrf": getCookie("_xsrf")};
	        if (updater.cursor) args.cursor = updater.cursor;
	        $.ajax({url: "/live/timeseries/subscribe/", type: "POST", dataType: "text",
	        	data: $.param(args), success: updater.onSuccess,
	        	error: updater.onError
	        });
	    },

	    onSuccess: function(response) {
	        try {updater.newData(eval("(" + response + ")"));}
	        catch (e) {updater.onError();return;}
	        updater.errorSleepTime = 500;
	        window.setTimeout(updater.poll, 0);
	    },

	    onError: function(response) {
	        updater.errorSleepTime *= 2;
	        console.log("Poll error; sleeping for", updater.errorSleepTime, "ms");
	        window.setTimeout(updater.poll, updater.errorSleepTime);
	    },

	    newData: function(response) {
	        if (!response.dataPoints) return;
	        updater.cursor = response.cursor;
	        updater.cursor = response.dataPoints[response.dataPoints.length - 1].id;
	        //console.log(response.dataPoints.length, "new messages, cursor:", updater.cursor);
	        for (var i = 0; i < response.dataPoints.length; i++) {
	        	var dataPoint = response.dataPoints[i]
	        	dataPoints[0].values.push([new Date(dataPoint.time),dataPoint.value])
	        }
	        updateChart();
	    }
	};
	
	updater.poll();
	
	chart = nv.models.lineChart()
		.x(function(d) { return d[0] })
		.y(function(d) { return d[1] }) //adjusting, 100% is 1.00, not 100 as it is in the data
		.color(d3.scale.category10().range())
		.useInteractiveGuideline(true);
	chart.xAxis
		.tickFormat(function(d) {
			return d3.time.format('%H:%M')(new Date(d))
		});
	chart.yAxis
		.tickFormat(d3.format(',.1f'));
	
	function updateChart(){
		d3.select('#chart svg')
			.datum(dataPoints)
			.call(chart);

		//TODO: Figure out a good way to do this automatically
		nv.utils.windowResize(chart.update);

		return chart;
	}
	nv.addGraph(updateChart);
	
});