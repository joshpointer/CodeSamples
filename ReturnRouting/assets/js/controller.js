'use strict';



angular.module('ReturnRoutingApp').controller('ReturnRoutingController', ['$scope', 'MessageService', 'ReturnRoutingService', function( $scope, MessageService, ReturnRoutingService ) {

	$scope.warehousePriorities = ReturnRoutingService.warehousePriorities;

	$scope.ui = {};

	$scope.ui.warehouseColors = { 851: '#82b1dd',
								  853: '#f57936',
								  871: '#0073a8',
								  872: '#b9916e',
								    0: '#32a100' };

	$scope.ui.map = { activeMapClick: false,
					  currentClickedStateId: '',
				  	  clickPositionTop: 0,
					  clickPositionLeft: 0,
				   	  warehouseMenuTimeoutId: 0,
					  stateColors: {},
				   	  currentPriorityIndex: 0 };

	$scope.getWarehouseClass = function( warehouseNumber ) {
		return 'route_' + warehouseNumber;
	}

	$scope.showWarehouseMenu = function() {

		if ( $scope.ui.map.activeMapClick === true ) {

			$scope.ui.map.clickPositionTop = event.pageY;
			$scope.ui.map.clickPositionLeft = event.pageX;

			$scope.ui.map.activeMapClick = false;

			var element = angular.element(document).find('#warehouseMenu');

			var styles = { display: 'block',
						   top: $scope.ui.map.clickPositionTop - 10,
						   left: $scope.ui.map.clickPositionLeft - element.width() };

			element.css( styles );

			$scope.ui.map.warehouseMenuTimeoutId = setTimeout( $scope.hideWarehouseMenu, 1000 );

		} else {

			$scope.hideWarehouseMenu();
		}
	}

	$scope.clearWarehouseMenuTimeout = function() {
		clearTimeout( $scope.ui.map.warehouseMenuTimeoutId );
	}

	$scope.hideWarehouseMenu = function() {
		$scope.ui.map.currentClickedStateId = '';
		angular.element(document).find('#warehouseMenu').css('display','none');
	}

	$scope.setStateWarehouse = function( warehouseNumber ) {

		var stateId = $scope.ui.map.currentClickedStateId.toUpperCase();

		// Don't allow a given state/warehouse combination to be assigned more than once.
		if ( warehouseNumber !== 0 && $scope.warehousePriorities.priorities[ stateId ].indexOf( warehouseNumber ) !== -1 ) {
			MessageService.showStatusMessage('error','That state/warehouse combination has already been assigned.');
			return;
		}

		$scope.warehousePriorities.priorities[ stateId ][ $scope.ui.map.currentPriorityIndex ] = warehouseNumber;

		// The user may have added a lower priority for a state without filling the priorities between it and the previous lowest
		// priority. So for example, 'FL' may have been setup with a first and second priority (indexes 0 and 1 in FL's priority
		// array) and then the user may have added a fifth priority (index 4) without explicity providing priorities three and four
		// (indexes 2 and 3). When that fifth priority is added to the state's priority array above, the values of those missing
		// indexes gets set to undefined. Convert those to explicit 0s here.
		for ( var i = 0; i < $scope.warehousePriorities.priorities[ stateId ].length; i++ ) {
			if ( typeof $scope.warehousePriorities.priorities[ stateId ][ i ] === 'undefined' ) {
				$scope.warehousePriorities.priorities[ stateId ][ i ] = 0;
			}
		}

		$scope.hideWarehouseMenu();
	}

	$scope.setCurrentPriorityIndex = function( index ) {
		$scope.ui.map.currentPriorityIndex = index;
	}

	$scope.saveWarehousePriorities = function() {

		MessageService.showStatusMessage('info','Saving changes...');

		ReturnRoutingService.saveWarehousePriorities()
			.then(	function success() {
						MessageService.showStatusMessage('success','Done!');
					},
					function error() {
						MessageService.showStatusMessage('error','Unable to save changes.');
					}
			);
	}

}]);
