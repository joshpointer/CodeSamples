'use strict';



angular.module('ReturnRoutingApp').factory('ReturnRoutingService', ['$http', '$q', function( $http, $q ) {

	var service = {};

	service.warehousePriorities = {};

	service.getWarehousePriorities = function() {

		var promiseObj = $q.defer();

		$http(	{ method: 'GET',
				  url: '/newwebadmin/logistics:returnRouting.getWarehousePriorities' }
		)
		.then(	function success( response ) {
					angular.copy( response.data, service.warehousePriorities );
					promiseObj.resolve();
				},
				function error() {
					promiseObj.reject();
				}
		)

		return promiseObj.promise;
	}

	service.saveWarehousePriorities = function() {

		var promiseObj = $q.defer();

		$http( { method: 'POST',
				 url: '/newwebadmin/logistics:returnRouting.saveWarehousePriorities',
				 headers: {'Content-Type':'application/x-www-form-urlencoded'},
				 data: $.param( { 'priorities': JSON.stringify(service.warehousePriorities.priorities) } ) }
		)
		.then(	function success() {
					promiseObj.resolve();
				},
				function error() {
					console.log('ERROR: ReturnRoutingService.saveWarehousePriorities()');
					promiseObj.reject();
				}
		)

		return promiseObj.promise;
	}

	service.getWarehousePriorities();

	return service;

}]);
