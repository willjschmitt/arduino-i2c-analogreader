define(['angularAMD','underscore','jquery',
           "prettify","perfect-scrollbar","icheck","bootstrap-select",
           "datatables.net","bootstrap_dataTables","jquery_fullscreen",
           "moment","fullcalendar","sparkline","peity","chartist","summernote",
           "nvd3",
           //"ckeditor","wysihtml5",
           
           "materialRipple","snackbar","toasts","speedDial","circularProgress",
           "linearProgress","subheader","simplePieChart",
           
           "bemat-common","bemat-demo","bemat-demo-chartist","bemat-demo-dashboard",
           
           "jquery-ui","bootstrap","modernizr",
           
           //"toggleable-element",
    ],function(angularAMD,_,$){
	var app = angular.module('dashboard', [])
	.service('timeSeriesSocket',function(){
		//message queue lets us queue up items while the socket is not currently open
		this._msgqueue = [];
		this._flushqueue = function(){ for (msg in this._msgqueue){this._socket.send(JSON.stringify(this._msgqueue[msg]))}; }
		
		//handle the fundamentals of creating and managing the websocket
		this._isopen=false;
		this._socket = new WebSocket("ws://localhost:8888/live/timeseries/socket/");
		this._socket.onopen = function(){
			this._isopen = true; this._flushqueue();
		}.bind(this);
		this._socket.onmessage = function(msg){
			var parsed = JSON.parse(msg.data);
			this._subscribers[parsed.name].newData([parsed]);
		}.bind(this);
		this._socket.onclose = function(){
	  		this._isopen=false;
		}.bind(this);
		
		//entry point for subscriptions to initiate the subscription
		this._subscribers = {};
		this.subscribe = function(subscriber){
			this._subscribers[subscriber.name] = subscriber;
			this._msgqueue.push({
				recipe_instance: subscriber.recipe_instance,
				name: subscriber.name,
				subscribe: true
			});
			if (this._isopen) this._flushqueue();
		};
	})
	.factory('timeSeriesUpdater',['timeSeriesSocket',function(timeSeriesSocket){
		var service = function(recipe_instance,name){
			this.recipe_instance = recipe_instance;
			this.name = name;
			
			this.errorSleepTime = 500;
			this.cursor = null;
			
			this.dataPoints = [];
			
			var self = this;
			timeSeriesSocket.subscribe(self)
		}
	
		service.prototype.newData = function(dataPointsIn) {
		    for (var i = 0; i < dataPointsIn.length; i++) {
		    	var dataPoint = dataPointsIn[i];
		    	this.dataPoints.push([new Date(dataPoint.time),parseFloat(dataPoint.value)]);
		    	this.latest = parseFloat(dataPoint.value);
		    }
		};
	    
	    return service;
	}])
	.controller('dashboardController',['$scope','$timeout','$interval','timeSeriesUpdater',function($scope,$timeout,$interval,timeSeriesUpdater){
		
		function getCookie(name) {
		    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
		    return r ? r[1] : undefined;
		}
		
		$scope.recipeInstance = 1;
		
		//subscribe to all the time series
		$scope.boilTemperatureActual = new timeSeriesUpdater($scope.recipeInstance,'boilKettle__temperature');
		$scope.boilTemperatureSetPoint = new timeSeriesUpdater($scope.recipeInstance,'boilKettle__temperatureSetPoint');
		$scope.mashTemperatureActual = new timeSeriesUpdater($scope.recipeInstance,'mashTun__temperature');
		$scope.mashTemperatureSetPoint = new timeSeriesUpdater($scope.recipeInstance,'mashTun__temperatureSetPoint');
		$scope.boilKettleDutyCycle = new timeSeriesUpdater($scope.recipeInstance,'boilKettle_dutyCycle');
		$scope.boilKettlePower = new timeSeriesUpdater($scope.recipeInstance,'boilKettle_power');
		$scope.systemEnergy = new timeSeriesUpdater($scope.recipeInstance,'systemEnergy');
		$scope.systemEnergyCost = new timeSeriesUpdater($scope.recipeInstance,'systemEnergyCost');
		
		//add all the relevant time series to the chart data.
		$scope.dataPoints = [];
		$scope.dataPoints.push({'key':'Boil Actual',values:$scope.boilTemperatureActual.dataPoints});
		$scope.dataPoints.push({'key':'Boil Set Point','values':$scope.boilTemperatureSetPoint.dataPoints});
		$scope.dataPoints.push({'key':'Mash Actual',values:$scope.mashTemperatureActual.dataPoints});
		$scope.dataPoints.push({'key':'Mash Set Point','values':$scope.mashTemperatureSetPoint.dataPoints});
	
		//update the pie chart dial color class based on the value
		$interval(function(){
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
		},500.);
		
		
		//overridable statuses - sensor ids for the child elements
		$scope.heatingElementStatusSensor = 9;
		$scope.heatingElementStatusSensorOverride = 10;
		
		$scope.pumpStatusSensor = 11;
		$scope.pumpStatusSensorOverride = 12;
		
		
		//list of tasks to be displayed in the task list
		$scope.tasks = [
		    {name:"Sanitizing Soak"},
		    {name:"Hot Sanitizing Recirculation"},
		    {name:"Run Brew Cycle"},
		    {name:"Measure Post-Mash Gravity"},
		    {name:"Clean Mash Tun"},
		    {name:"Sanitize Fermenters"},
		    {name:"Measure Post-Boil Gravity"},
		    {name:"Rack to Fermenters"},
		    {name:"Clean Boil Kettle and Chiller"},	    
		]
		
		//create and maintain chart 
		$scope.chart = null;
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
			    //TODO: I shouldnt need to do a deep copy. nvd3 seems to screw around with the references in $scope.dataPoints otherwise and it becomes detached from the service (I think its from a map call that sets to itself)
				.datum(angular.copy($scope.dataPoints))
				.call($scope.chart);
			
			//TODO: Figure out a good way to do this automatically
			nv.utils.windowResize($scope.chart.update);
			
			//calculate min/max in current dataset
			//TODO: I don't know why nvd3 messes up sometimes, but we had to force calculat this
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
			$scope.chart.forceY([min,max]);
	
			return $scope.chart;
		}
		nv.addGraph(updateChart);
		$interval(updateChart,1000.);//replot every second rather than everytime we get new data so we arent plotting all the time
	}])
	.directive('toggleableElement', ['timeSeriesUpdater', function(timeSeriesUpdater) {
	  return {
	    restrict: 'E',
	    transclude: true,
	    scope: {
	    	name:"=",
	    	recipeInstance: "=",
	    	sensor: "=",
	    	sensorOverride: "=",
	    },
	    templateUrl: 'static/html/angular-directives/toggleable-element.html',
	    link: function ($scope) {
	    	//subscribe to value and override 
	    	$scope.elementOverride = new timeSeriesUpdater($scope.recipeInstance,$scope.sensorOverride);
	    	$scope.elementStatus = new timeSeriesUpdater($scope.recipeInstance,$scope.sensor);
	    	
	    	//status setters
	    	$scope.toggleElementStatus = function(){
	        	$scope.setElementStatus(!$scope.elementStatus.latest);
	    	};
	    	$scope.setElementStatus = function(statusValue){
	    		function __setElementStatus(statusValue){
		    		$.ajax({
		    			url: "/live/timeseries/new/", type: "POST", dataType: "text",
		    			data: $.param({
			    			recipe_instance: $scope.recipeInstance,
			    			sensor: $scope.sensor,
			    			value: statusValue
			    		})
			    	});
		    	}
	    		
	    		//make sure we have the override set
	    		if (!$scope.elementOverride.latest)
	    			$scope.toggleElementOverride(function(){__setElementStatus(statusValue);});
	    		else
	    			__setElementStatus(statusValue);
	    	};
	    	
	    	
	    	//override setters
	    	$scope.toggleElementOverride = function(callback){
	    		$scope.setElementOverride(!$scope.elementOverride,callback);
	    	};
	    	$scope.setElementOverride = function(overrideValue){
	    		$.ajax({
	    			url: "/live/timeseries/new/", type: "POST", dataType: "text",
	    			data: $.param({
	        			recipe_instance: $scope.recipeInstance,
	        			sensor: $scope.sensor,
	        			value: overrideValue
	        		}), success: function(){if (callback) callback();}
	        	});
	    	}
	    }
	  };
	}]);
	//angular.module('toggleableElementModule', []);
	return angularAMD.bootstrap(app);
});