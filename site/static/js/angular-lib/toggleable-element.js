define(['angularAMD','moment','timeseries'],function(angularAMD,moment){
	angularAMD
	.directive('toggleableElement', ['timeSeriesUpdater', function(timeSeriesUpdater) {
	  return {
	    restrict: 'E',
	    transclude: true,
	    scope: {
	    	name:"=",
	    	recipeInstance: "=",
	    	sensorName: "=",
	    },
	    templateUrl: 'static/html/angular-directives/toggleable-element.html',
	    link: function ($scope) {
	    	//subscribe to value and override 
	    	$scope.elementOverride = new timeSeriesUpdater($scope.recipeInstance,$scope.sensorName);
	    	$scope.elementStatus = new timeSeriesUpdater($scope.recipeInstance,$scope.sensorName + "Override");
	    	
	    	//status setters
	    	$scope.toggleElementStatus = function(){$scope.setElementStatus(!$scope.elementStatus.latest);};
	    	$scope.setElementStatus = function(statusValue){
	    		function __setElementStatus(statusValue){
	    			var now = moment().toISOString();
	    			$.ajax({
		    			url: "/live/timeseries/new/", type: "POST", dataType: "text",
		    			data: $.param({
			    			recipe_instance: $scope.recipeInstance,
			    			sensor: $scope.elementStatus.sensor,
			    			value: statusValue,
			    			time: now,
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
	    	$scope.toggleElementOverride = function(callback){$scope.setElementOverride(!$scope.elementOverride.latest,callback);};
	    	$scope.setElementOverride = function(overrideValue,callback){
	    		var now = moment().toISOString();
	    		$.ajax({
	    			url: "/live/timeseries/new/", type: "POST", dataType: "text",
	    			data: $.param({
	        			recipe_instance: $scope.recipeInstance,
	        			sensor: $scope.elementOverride.sensor,
	        			value: overrideValue,
	        			time: now,
	        		}), success: function(){ if (callback) callback(); }
	        	});
	    	}
	    }
	  };
	}]);
});