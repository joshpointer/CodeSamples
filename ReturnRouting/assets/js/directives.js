'use strict';



angular.module('ReturnRoutingApp').directive('wssJqvMap', function() {

	return {
		restrict: 'A',
		link: function( $scope, element ) {

			element.vectorMap({
				map: 'usa_en',
				backgroundColor: '#ffffff',
				color: '#555555',
				//selectedColor: '#555555',
				enableZoom: false,
				showTooltip: true,
				colors: $scope.ui.map.stateColors,
				onRegionClick: function( event, code, region ) {

					$scope.ui.map.activeMapClick = true;
					$scope.ui.map.currentClickedStateId = code;

					event.preventDefault();
				}
			});

			$scope.$watch( 	function() {
								return $scope.warehousePriorities.priorities;
							},
							function() {
								$scope.updateStateColors();
							},
							true
			);

			$scope.$watch( 	function() {
								return $scope.ui.map.currentPriorityIndex;
							},
							function() {
								$scope.updateStateColors();
							}
			);

			$scope.updateStateColors = function() {

				$scope.ui.map.stateColors = {};

				for ( var stateId in $scope.warehousePriorities.priorities ) {

					var warehouseNumber;

					if ( typeof $scope.warehousePriorities.priorities[ stateId ][ $scope.ui.map.currentPriorityIndex ] !== 'undefined' ) {
						warehouseNumber = $scope.warehousePriorities.priorities[ stateId ][ $scope.ui.map.currentPriorityIndex ];
					} else {
						warehouseNumber = 0;
					}

					$scope.ui.map.stateColors[ stateId.toLowerCase() ] = $scope.ui.warehouseColors[ warehouseNumber ];
				}

				element.vectorMap( 'set', 'colors', $scope.ui.map.stateColors );
			}

		}
	};

});
