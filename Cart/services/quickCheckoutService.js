


wss.shoppingCart.quickCheckoutService = ( function( $, CartService, CustomerService ) {

	'use strict';

	var service = {};

	service.getQuickCheckout = function() {

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  dataType: 'html',
				  type: 'GET',
				  url: '/shoppingcart:checkout/quickcheckout/' } )
		.then(	function success( response ) {
					promiseObj.resolve( response );
				},
				function error() {
					console.log('ERROR: quickCheckoutService.getQuickCheckout()');
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.showQuickCheckout = function() {

		if ( CartService.cart.itemSortOrder.length === 0 
			 || CartService.hasProblematicItem()
			 || !CustomerService.customer.showQuickCheckout ) {
			return false;
		}

		return true;
	}

	return service;

})( jQuery, 
	wss.shoppingCart.cartService, 
	wss.shoppingCart.customerService );
