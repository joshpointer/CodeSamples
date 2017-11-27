


wss.shoppingCart.customerService = ( function( $, customerPreloadData ) {

	'use strict';

	var service = {};
	
	service.customer = customerPreloadData || {};

	service.updateShipToState = function() {

		var shipToState = $.cookie('SHIPTOSTATE');

		if ( typeof shipToState !== 'undefined' 
			 && shipToState !== null
			 && shipToState !== service.customer.shipToState ) {
			service.customer.shipToState = shipToState;
			$( service ).trigger( 'customerUpdate' );
		}
	}

	return service;

}( jQuery, wss.shoppingCart.customerPreloadData ));
