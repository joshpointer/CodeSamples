


wss.shoppingCart.addOnSpecialsService = ( function( $ ) {

	'use strict';

	var service = {};

	service.getAddOnSpecials = function() {

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  dataType: 'json',
				  type: 'GET',
				  url: '/shoppingcart:cart/getaddonspecials/' } )
		.then(	function success( response ) {
					promiseObj.resolve( response );
				},
				function error() {
					console.log('ERROR: addOnSpecialsService.getAddOnSpecials()');
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	return service;

}( jQuery ));
