define(['angularAMD','timeseries'],function(angularAMD){
	angularAMD
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
});