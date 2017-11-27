


wss.shoppingCart.quickCheckoutController = ( function( $, QuickCheckoutService, CartService, CustomerService, ProgressSpinner, CheckoutService ) {



	'use strict';



	if ( !wss.shoppingCart.isEnabled ) return;



	var rootElement = $('[data-wss-controller=quickCheckoutController]');



	$( CartService ).on( 'pendingCartItemUpdate', pendingCartItemUpdateHandler );
	$( CartService ).on( 'cartItemUpdate', modelUpdateHandler );
	$( CustomerService ).on( 'customerUpdate', modelUpdateHandler );

	function pendingCartItemUpdateHandler() {
		
		showQuickCheckout();
	}

	function modelUpdateHandler() {

		showQuickCheckout();

		if ( !QuickCheckoutService.showQuickCheckout() ) return;

		showReloadState();

		if ( CartService.cartItemUpdateInProgress() ) return;
		
		QuickCheckoutService.getQuickCheckout()
			.then(	function success( response ) {
						rootElement.html( response );
						rootElement.find('.more-info').popover({
							html: true,
							content: function() { return $('#quick-checkout-info').html(); }
						});
						/* There is a timing dependency between loading the quick checkout feature and loading the checkout shipping options. Quick checkout has to load first to function properly. So we give quick checkout the lead when reloading the shipping options after a cart model update, allowing it to get its own act together before updateShipping() fires. There is a backup call to updateShipping() in the checkout controller that refreshes shipping options in situations where quick checkout isn't active (and thus this block of code isn't executing). */
						CheckoutService.updateShipping();
					},
					function error() {
						/* We're not even going to try to straighten things out if our call to the quick checkout backend fails with a 500. We're just going to empty out the root element (effectively hiding it) and live to fight another day. By not completely disabling the feature, we leave open the possibility the problem will self-correct (i.e., we will stop erroring out at the server) on a subsequent call, in which case the feature should just reappear per the success callback. */
						rootElement.html('');
						/* See the note in the success callback above to understand why the following needs to happen. */
						CheckoutService.updateShipping();
					});
	}



	function showQuickCheckout() {

		if ( QuickCheckoutService.showQuickCheckout() ) {
			rootElement.css({'display':''});
		} else {
			rootElement.css({'display':'none'});
		}
	}

	function showReloadState() {

		rootElement.find('.quickCheckoutDisclaimer').css({'display':'none'});
		rootElement.find('.quickCheckoutShippingMethod').css({'display':'none'});
		rootElement.find('.quickCheckoutPayment').children().css({'display':'none'});
		rootElement.find('.quickCheckoutShippingLoading').css({'display':''});
	}



})( jQuery,
	wss.shoppingCart.quickCheckoutService, 
	wss.shoppingCart.cartService, 
	wss.shoppingCart.customerService, 
	wss.shoppingCart.progressSpinnerComponent,
	wss.shoppingCart.checkoutService );
