define(['angularAMD',"simplePieChart"],function(angularAMD){
	angularAMD
	.directive('dial',['$interval', function($interval) {
		return {
		    restrict: 'E',
		    transclude: true,
		    scope: {
		    	title:"=",
		    	value: "=",
		    },
		    templateUrl: 'static/html/angular-directives/dial.html',
		    link: function ($scope,$element) {
		    	//update the pie chart dial color class based on the value
		    	//TODO: get duration to work
		    	$element.find(".bemat-pie-chart").simplePieChart();
		    	$interval(function(){
					$element.find(".bemat-pie-chart").simplePieChart("set",($scope.value*100.).toPrecision(2));
					var colorClasses = {//maps a range to color for the dial
						'cc-spc-primary':{min:0.,max:0.0},
						'cc-spc-success':{min:0.0,max:0.5},
						'cc-spc-info':{min:0.5,max:0.75},
						'cc-spc-warning':{min:0.75,max:0.90},
						'cc-spc-danger':{min:0.90,max:1.0},
					};
					$.each(colorClasses,function(name,details){
						$element.find(".bemat-pie-chart").removeClass(name);
						if ($scope.value > details.min && $scope.value <= details.max)
							$element.find(".bemat-pie-chart").addClass(name);
					});
				},500.);
		    }
		};
	}]);
});