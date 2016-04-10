$(document).ready(function(){
	var dataPoints = [],
		chart;
	
	dataPoints.push({'key':'Boil Actual','values':[]});
	dataPoints.push({'key':'Boil Set Point','values':[]});
	var dataPointsMap = {
		1:0,
		2:1
	};
	
	function getCookie(name) {
	    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
	    return r ? r[1] : undefined;
	}

	var updaterClass = function(recipe_instance,sensor){
		this.errorSleepTime = 500;
		this.cursor = null;
		
		this.recipe_instance = recipe_instance;
		this.sensor = sensor;

		this.poll =  function() {
	        var args = {"_xsrf": getCookie("_xsrf")};
	        if (this.cursor) args.cursor = this.cursor;
	        args.recipe_instance = recipe_instance;
	        args.sensor = sensor;
	        $.ajax({url: "/live/timeseries/subscribe/", type: "POST", dataType: "text",
	        	data: $.param(args), success: this.onSuccess,
	        	error: this.onError
	        });
	    }.bind(this);

	    this.onSuccess = function(response) {
	        try {this.newData(eval("(" + response + ")"));}
	        catch (e) {this.onError();return;}
	        this.errorSleepTime = 500;
	        window.setTimeout(this.poll, 0);
	    }.bind(this);

	    this.onError = function(response) {
	        this.errorSleepTime *= 2;
	        console.log("Poll error; sleeping for", this.errorSleepTime, "ms");
	        window.setTimeout(this.poll, this.errorSleepTime);
	    }.bind(this);

	    this.newData = function(response) {
	        if (!response.dataPoints) return;
	        this.cursor = response.cursor;
	        this.cursor = response.dataPoints[response.dataPoints.length - 1].id;
	        //console.log(response.dataPoints.length, "new messages, cursor:", updater.cursor);
	        for (var i = 0; i < response.dataPoints.length; i++) {
	        	var dataPoint = response.dataPoints[i];
	        	dataPoints[dataPointsMap[this.sensor]].values.push([new Date(dataPoint.time),parseFloat(dataPoint.value)]);
	        }
	        updateChart();
	    };
	}
	
	boilTemperatureActual = new updaterClass(1,1);
	boilTemperatureSetPoint = new updaterClass(1,2);
	boilTemperatureActual.poll();
	boilTemperatureSetPoint.poll();
	
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
		
		//calculate min/max in current dataset
		var min = _.reduce(dataPoints,function(currentMin,dataPointArray){
			var min = _.reduce(dataPointArray.values,function(currentMin,dataPoint){
				return Math.min(dataPoint[1],currentMin);
			},Infinity);
			return Math.min(min,currentMin);
		},Infinity);
		var max = _.reduce(dataPoints,function(currentMax,dataPointArray){
			var max = _.reduce(dataPointArray.values,function(currentMax,dataPoint){
				return Math.max(dataPoint[1],currentMax);
			},Infinity);
			return Math.max(min,currentMax);
		},-Infinity);
		
		//make sure we have a spread
		var minSpread = 10.;
		if ((max-min) < minSpread){
			var spreadAdjust = (minSpread-(max-min))*.5;
			max+= spreadAdjust;
			max-= spreadAdjust;
		}
		
		//update min/max
		//TODO: I don't know why nvd3 messes up sometimes, but we had to force calculat this
		chart.forceY([min,max]);

		return chart;
	}
	nv.addGraph(updateChart);
	
});