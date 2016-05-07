define(['angularAMD','underscore','jquery',
           "prettify","perfect-scrollbar","icheck","bootstrap-select",
           "datatables.net","jquery_fullscreen",
           "moment",
           "nvd3",
           
           "materialRipple","snackbar","toasts","speedDial","circularProgress",
           "linearProgress","subheader","simplePieChart",
           
           "bemat-common",
           
           "jquery-ui","bootstrap","modernizr",
           
           'timeseries',"toggleable-element",'value-card','dial',
    ],function(angularAMD,_,$){
	var app = angular.module('dashboard', [])
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
		$scope.boilKettleDutyCycle = new timeSeriesUpdater($scope.recipeInstance,'boilKettle__dutyCycle');
		$scope.boilKettlePower = new timeSeriesUpdater($scope.recipeInstance,'boilKettle__power');
		$scope.systemEnergy = new timeSeriesUpdater($scope.recipeInstance,'systemEnergy');
		$scope.systemEnergyCost = new timeSeriesUpdater($scope.recipeInstance,'systemEnergyCost');
		$scope.currentStatus = new timeSeriesUpdater($scope.recipeInstance,'state');
		
		var statuses = [
		    "System is currently offline.",
		    "Heating water for strike.",
		    "Pumping water to mash tun for strike.",
		    "Stabilizing hot liquor tun water temperature.",
		    "Mashing grain.",
		    "Raising hot liquor tun to 170&deg;F for mashout.",
		    "Mashout. Recirculating at 170&deg;F.",
		    "Preparing for sparge. Waiting for reconfiguration. Ensure output of HLT is configured to pump to Mash Tun.",
		    "Sparging. Pumping hot liquor into mash tun.",
		    "Preparing for boil. Waiting for reconfiguration. Ensure sparged liquid is configured to pump into boil kettle and boil kettle is empty.",
		    "Preheating boil. Raising temperature to boil temperature.",
		    "Cooling boil kettle. Make sure the cooling setup is in place.",
		    "Pumping cooled wort into fermeneter.",
		];
		$scope.currentStatusText = statuses[$scope.currentStatus.latest];
		$scope.nextStatusText = statuses[$scope.currentStatus.latest + 1];
		$scope.adjustState = function(amount){$scope.currentStatus.set($scope.currentStatus.latest + amount);};
		
		//add all the relevant time series to the chart data.
		$scope.dataPoints = [];
		$scope.dataPoints.push({'key':'Boil Actual',values:$scope.boilTemperatureActual.dataPoints});
		$scope.dataPoints.push({'key':'Boil Set Point','values':$scope.boilTemperatureSetPoint.dataPoints});
		$scope.dataPoints.push({'key':'Mash Actual',values:$scope.mashTemperatureActual.dataPoints});
		$scope.dataPoints.push({'key':'Mash Set Point','values':$scope.mashTemperatureSetPoint.dataPoints});
	
		
		
		
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
		];		
		
		$.toasts("add",{msg: "Welcome to Joulia!"});
		$.snackbar("add",{
			type: 		"danger",
			msg: 		"Connection lost. Reestablishing connection.",
			buttonText: "Close",
		});

		
		/**
		 * create and maintain chart
		 */ 
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
			var minSpread = 10.; //make sure we have a spread
			if ((max-min) < minSpread){
				var spreadAdjust = (minSpread-(max-min))*.5;
				max+= spreadAdjust;
				max-= spreadAdjust;
			}
			$scope.chart.forceY([min,max]);//update min/max
	
			return $scope.chart;
		}
		nv.addGraph(updateChart);
		$interval(updateChart,5000.);//replot every second rather than everytime we get new data so we arent plotting all the time
	}]);
	//angular.module('toggleableElementModule', []);
	return angularAMD.bootstrap(app);
});