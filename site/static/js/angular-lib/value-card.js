define(['angularAMD',"peity"],function(angularAMD){
	angularAMD
	.directive('valueCard', function() {
		return {
		    restrict: 'E',
		    transclude: true,
		    scope: {
		    	title:"=",
		    	value: "=",
		    	valueAlternate: "=",
		    	units: "=",
		    	unitsAlternate: "=",
		    },
		    templateUrl: 'static/html/angular-directives/value-card.html',
		    link: function ($scope) {
		    	if (!$scope.unitsAlternate) $scope.unitsAlternate= $scope.units;
		    	
		    	//give us all the little line things for the little cards
				$(".peity-line").peity("line",{height: 28,width: 64});
		    }
		};
	});
});