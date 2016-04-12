angular.module('app', [])
.factory('timeSeriesUpdater',function(){
	var service = function(recipe_instance,sensor){
		this.recipe_instance = recipe_instance;
		this.sensor = sensor;
		
		this.errorSleepTime = 500;
		this.cursor = null;
		
		this.dataPoints = [];
	}
	
	service.prototype.poll =  function() {
        var args = {};//{"_xsrf": getCookie("_xsrf")};
        if (this.cursor) args.cursor = this.cursor;
        args.recipe_instance = this.recipe_instance;
        args.sensor = this.sensor;
        var self = this;
        $.ajax({url: "/live/timeseries/subscribe/", type: "POST", dataType: "text",
        	data: $.param(args), success: this.onSuccess.bind(self),
        	error: this.onError.bind(self)
        });
    };
    
    service.prototype.onSuccess = function(response) {
        try {this.newData(eval("(" + response + ")"));}
        catch (e) {this.onError();return;}
        this.errorSleepTime = 500;
        var self = this;
        window.setTimeout(this.poll.bind(self), 0);
    };
    
    service.prototype.onError = function(response) {
    	this.errorSleepTime *= 2;
        console.log("Poll error; sleeping for", this.errorSleepTime, "ms");
        var self = this;
        window.setTimeout(this.poll.bind(self), this.errorSleepTime);
    };

	service.prototype.newData = function(response) {
	    if (!response.dataPoints) return;
	    this.cursor = response.cursor;
	    this.cursor = response.dataPoints[response.dataPoints.length - 1].id;
	    //console.log(response.dataPoints.length, "new messages, cursor:", updater.cursor);
	    for (var i = 0; i < response.dataPoints.length; i++) {
	    	var dataPoint = response.dataPoints[i];
	    	this.dataPoints.push([new Date(dataPoint.time),parseFloat(dataPoint.value)]);
	    	this.latest = parseFloat(dataPoint.value);
	    }
	};
    
    return service;
})
.controller('dashboardController',['$scope','$timeout','timeSeriesUpdater',function($scope,$timeout,timeSeriesUpdater){
	$scope.dataPoints = []
	$scope.chart = null;
	
	var dataPointsMap = {
		0:{name: 'boilTemperatureActual'},
		1:{name: 'boilTemperatureSetPoint'},
		2:{name: 'mashTemperatureActual'},
		3:{name: 'mashTemperatureSetPoint'},
	}
	
	var noLineDataPointsMap = [
	    'boilKettleDutyCycle',
	    'boilKettlePower',
	    'systemEnergy',
	    'systemEnergyCost',	    
	]
	
	function getCookie(name) {
	    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
	    return r ? r[1] : undefined;
	}

	//create new subscription services for the time series data
	$scope.boilTemperatureActual = new timeSeriesUpdater(1,1);
	$scope.dataPoints.push({'key':'Boil Actual',values:$scope.boilTemperatureActual.dataPoints});
	$scope.boilTemperatureActual.poll();
	
	$scope.boilTemperatureSetPoint = new timeSeriesUpdater(1,2);
	$scope.dataPoints.push({'key':'Boil Set Point','values':$scope.boilTemperatureSetPoint.dataPoints});
	$scope.boilTemperatureSetPoint.poll();
	
	$scope.mashTemperatureActual = new timeSeriesUpdater(1,3);
	$scope.dataPoints.push({'key':'Mash Actual',values:$scope.mashTemperatureActual.dataPoints});
	$scope.mashTemperatureActual.poll();
	
	$scope.mashTemperatureSetPoint = new timeSeriesUpdater(1,4);
	$scope.dataPoints.push({'key':'Mash Set Point','values':$scope.mashTemperatureSetPoint.dataPoints});
	$scope.mashTemperatureSetPoint.poll();
	
	$scope.boilKettleDutyCycle = new timeSeriesUpdater(1,5);
	$scope.boilKettleDutyCycle.poll();
	
	$scope.boilKettlePower = new timeSeriesUpdater(1,6);
	$scope.boilKettlePower.poll();
	
	$scope.systemEnergy = new timeSeriesUpdater(1,7);
	$scope.systemEnergy.poll();
	
	$scope.systemEnergyCost = new timeSeriesUpdater(1,8);
	$scope.systemEnergyCost.poll();
	
	//TODO: don't know why the timeSeriesUpdater change isn't propogating unless I touch it? I really should be having to do a time check...
	function checkLatest(){
		try{
			for (var i =0; i < $scope.dataPoints.length; i++)$scope.dataPoints[i].values = $scope[dataPointsMap[i].name].dataPoints;
			updateChart();
		}catch(e){}
		
		$("#dutycycledial").simplePieChart("set",$scope.boilKettleDutyCycle.latest*100.);
		var colorClasses = {
			'cc-spc-primary':{min:0.,max:0.0},
			'cc-spc-success':{min:0.0,max:0.5},
			'cc-spc-info':{min:0.5,max:0.75},
			'cc-spc-warning':{min:0.75,max:0.90},
			'cc-spc-danger':{min:0.90,max:1.0},
		};
		$.each(colorClasses,function(name,details){
			$("#dutycycledial").removeClass(name);
			if ($scope.boilKettleDutyCycle.latest > details.min && $scope.boilKettleDutyCycle.latest <= details.max)
				$("#dutycycledial").addClass(name);
		});
		
		$timeout(checkLatest,1000.);
	}
	checkLatest();
	
	
	
	
	
	$scope.chart = nv.models.lineChart()
		.x(function(d) { return d[0] })
		.y(function(d) { return d[1] }) //adjusting, 100% is 1.00, not 100 as it is in the data
		.color(d3.scale.category10().range())
		.useInteractiveGuideline(true);
	$scope.chart.xAxis
		.tickFormat(function(d) {
			return d3.time.format('%H:%M')(new Date(d))
		});
	$scope.chart.yAxis
		.tickFormat(d3.format(',.1f'));
	
	function updateChart(){
		d3.select('#chart svg')
			.datum($scope.dataPoints)
			.call($scope.chart);
		
		//TODO: Figure out a good way to do this automatically
		nv.utils.windowResize($scope.chart.update);
		
		//calculate min/max in current dataset
		var min = _.reduce($scope.dataPoints,function(currentMin,dataPointArray){
			var min = _.reduce(dataPointArray.values,function(currentMin,dataPoint){
				return Math.min(dataPoint[1],currentMin);
			},Infinity);
			return Math.min(min,currentMin);
		},Infinity);
		var max = _.reduce($scope.dataPoints,function(currentMax,dataPointArray){
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
		$scope.chart.forceY([min,max]);

		return $scope.chart;
	}
	nv.addGraph(updateChart);
	
}]);