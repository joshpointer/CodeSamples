


wss.shoppingCart.checkoutService = ( function( $, CartService ) {

	'use strict';

	var service = {};
	service.hideShippingOptionsLoadingSpinner = false;

	service.updateShipping = function() {

		/* Every update of the cart creates a new cartId. Since the shipping calculator JS pulls that value from a global variable, we need to update that global variable here. Otherwise the quote will fail as the shipping calculator CF compares the cartId passed in to it from JS with the cartId of the cart it pulls during processing and bombs out if they don't match. */
		if ( typeof window.CartID !== 'undefined' ) {
			window.CartID = CartService.cart.cartId;
		}

		if ( typeof window.callStartShipping === 'function' ) {
			service.hideShippingOptionsLoadingSpinner = true;
			window.callStartShipping();
		}
	}

	return service;

})( jQuery, wss.shoppingCart.cartService );
