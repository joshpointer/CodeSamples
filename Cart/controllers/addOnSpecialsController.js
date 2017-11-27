


wss.shoppingCart.addOnSpecialsController = ( function( $, AddOnSpecialsService, CartService ) {



	'use strict';



	if ( !wss.shoppingCart.isEnabled ) return;



	initializeAddOnSpecials();

	function initializeAddOnSpecials() {

		AddOnSpecialsService.getAddOnSpecials()
			.then(	function success( response ) {
						if ( typeof window.renderAddonItemGroup !== 'undefined'
							 && typeof window.changeToLowerCase !== 'undefined' ) {
							window.renderAddonItemGroup( window.changeToLowerCase( response ) );
						}
					});
	}



	$( CartService ).on( 'cartItemUpdate', showAddOnSpecials );

	function showAddOnSpecials() {

		if ( CartService.cart.itemSortOrder.length === 0 ) {
			$('#addon_items').css({'display':'none'});
		} else {
			$('#addon_items').css({'display':''});
		}
	}



}( jQuery, wss.shoppingCart.addOnSpecialsService, wss.shoppingCart.cartService ));
