


wss.shoppingCart.cartDiscountCodeController = ( function( $, CartService, CustomerService, UserAlertService, ProgressSpinner ) {



	'use strict';



	if ( !wss.shoppingCart.isEnabled ) return;



	var rootElement = $('[data-wss-controller=cartDiscountCodeController]');



	$(document).ready( initializeCartDiscountCodes );

	function initializeCartDiscountCodes() {

		showCartDiscountCodes();
		showExpiredDiscountUserAlerts();
	}



	$( CartService ).on( 'cartItemUpdate', cartItemUpdateHandler );

	rootElement.on( 'click', 'input.addCartDiscountCodeButton', addCartDiscountCodeHandler );
	rootElement.on( 'click', 'a.deleteCartDiscountCodeButton', deleteCartDiscountCodeHandler );
	rootElement.on( 'keypress', 'input.discountCode', discountCodeInputHandler )
	rootElement.on( 'click', 'button.employeeLoginButton', employeeLoginHandler );

	function cartItemUpdateHandler() {

		showCartDiscountCodes();
		showExpiredDiscountUserAlerts();
	}

	function addCartDiscountCodeHandler() {

		var discountCode = rootElement.find('.discountCode').val().trim();

		addCartDiscountCode( discountCode );
	}

	function deleteCartDiscountCodeHandler() {

		var discountCode = $(this).attr('data-discount-code');

		var progressSpinnerId = ProgressSpinner.add( rootElement.find('.cartDiscountCodes') );

		CartService.deleteDiscountCode( discountCode )
			.then(	function success() {
						ProgressSpinner.remove( progressSpinnerId );
						UserAlertService.showAlert( { type: 'success', 
													  message: 'Discount removed.', 
													  target: 'aboveDiscountCodes',
													  alertId: 'cartDiscountCodeSuccess' } );
					},
					function error() {
						ProgressSpinner.remove( progressSpinnerId );
						UserAlertService.showAlert( { type: 'error', 
													  message: 'There was a problem removing your discount code. Please try again.', 
													  target: 'aboveDiscountCodes',
													  alertId: 'cartDiscountCodeError' } );
					});
	}

	function discountCodeInputHandler( event ) {

		/* The only thing this handler does is allow the enter key to simulate the clicking of the submit button when the discount code input has focus. */

		if ( event.keyCode === 13 ) {
			addCartDiscountCodeHandler();
		}
	}

	function employeeLoginHandler() {

		var discountCode = rootElement.find('input[name=discountcode]').val().trim();
		var d_u = rootElement.find('input[name=d_u]').val().trim();
		var d_p = rootElement.find('input[name=d_p]').val().trim();
		var e_n = rootElement.find('input[name=e_n]').val().trim();

		addCartDiscountCode( discountCode, d_u, d_p, e_n );
	}



	function addCartDiscountCode( discountCode, d_u, d_p, e_n ) {

		if ( discountCode === '' ) {

			UserAlertService.showAlert( { type: 'error', 
										  message: 'Please enter a coupon code.', 
										  target: 'aboveDiscountCodes',
										  alertId: 'cartDiscountCodeError',
										  timeToLive: 2500 } );
			return;

		} else if ( discountCode.search( /^wishlist$/i ) !== -1 ) {

			/* A discount code of 'wishlist' is a request by the user to add the contents of the cart to a wishlist. We handle that with a redirect. */

			window.location.href = '/wishlist.cfm?addcart=1';

		} else if ( discountCode.length === 12 ) {

			/* A 12 character discount code is a gift card (WEBucks). Try to redeem it (assuming the user is logged in). */

			if ( !CustomerService.customer.isLoggedIn ) {
				UserAlertService.showAlert( { type: 'error', 
											  message: 'You must be logged in to apply WEBucks.', 
											  target: 'aboveDiscountCodes',
											  alertId: 'cartDiscountCodeError' } );
				return;
			}

			var progressSpinnerId = ProgressSpinner.add( rootElement.find('.cartDiscountCodeWrapper') );

			CartService.applyGiftCardDiscountCode( discountCode )
				.then(	function success( message, userAlertType ) {
							ProgressSpinner.remove( progressSpinnerId );
							rootElement.find('.discountCode').val('');
							UserAlertService.showAlert( { type: userAlertType, 
														  message: message, 
														  target: 'aboveDiscountCodes',
														  alertId: 'cartDiscountCodeSuccess' } );
						},
						function error() {
							ProgressSpinner.remove( progressSpinnerId );
							UserAlertService.showAlert( { type: 'error', 
														  message: 'There was a problem applying your WEBucks code. Please try again.', 
														  target: 'aboveDiscountCodes',
														  alertId: 'cartDiscountCodeError' } );
						});

		} else if ( discountCode.search( /^quote$/i ) !== -1 ) {

			/* A discount code of 'quote' is a request by the user to convert the current contents of the cart to a quote. The user has to be logged in to do this. */

			if ( !CustomerService.customer.isLoggedIn ) {
				UserAlertService.showAlert( { type: 'error', 
											  message: 'You must be logged in to request a quote.', 
											  target: 'aboveDiscountCodes',
											  alertId: 'cartDiscountCodeError' } );
				return;
			}

			var progressSpinnerId = ProgressSpinner.add( rootElement.find('.cartDiscountCodeWrapper') );

			CartService.applyQuoteDiscountCode()
				.then(	function success() {
							ProgressSpinner.remove( progressSpinnerId );
							rootElement.find('.discountCode').val('');
							UserAlertService.showAlert( { type: 'success', 
														  message: 'Your quote has been sent to the email registered to your WebstaurantStore account.', 
														  target: 'aboveDiscountCodes',
														  alertId: 'cartDiscountCodeSuccess' } );
						},
						function error() {
							ProgressSpinner.remove( progressSpinnerId );
							UserAlertService.showAlert( { type: 'error', 
														  message: 'There was a problem creating your quote. Please try again.', 
														  target: 'aboveDiscountCodes',
														  alertId: 'cartDiscountCodeError' } );
						});

		} else {

			/* If it isn't a wishlist, gift card or quote, it's a code associated with some sort of special. Process that here. If either d_u or e_n are defined it means the submission has come from the employee login form. Otherwise the submission has come from the discount code input. */

			if ( typeof d_u !== 'undefined' || typeof e_n !== 'undefined' ) {
				var progressSpinnerTargetElement = rootElement.find('.employeeLoginForm');
			} else {
				var progressSpinnerTargetElement = rootElement.find('.cartDiscountCodeWrapper');
			}

			var progressSpinnerId = ProgressSpinner.add( progressSpinnerTargetElement );

			CartService.applyDiscountCode( discountCode, d_u, d_p, e_n )
				.then(	function success( response ) {
							ProgressSpinner.remove( progressSpinnerId );
							rootElement.find('.discountCode').val('');
							if ( response.additionalActionRequired === 'validateEmployee' ) {
								showEmployeeLogin( discountCode );
							} else {
								showEmployeeLogin();
							}
							UserAlertService.showAlert( { type: response.userAlertType, 
														  message: response.userAlertMessage, 
														  target: 'aboveDiscountCodes',
														  alertId: 'cartDiscountCodeSuccess' } );
						},
						function error() {
							ProgressSpinner.remove( progressSpinnerId );
							UserAlertService.showAlert( { type: 'error', 
														  message: 'There was a problem applying your discount code. Please try again.', 
														  target: 'aboveDiscountCodes',
														  alertId: 'cartDiscountCodeError' } );
						});
		}
	}

	function showCartDiscountCodes() {

		var discountCodeRows = '';

		if ( CartService.cart.itemSortOrder.length === 0 ) {
			rootElement.css({'display':'none'});
			return;
		} else {
			rootElement.css({'display':''});
		}

		for ( var key in CartService.cart.discountCodes.active ) {

			var discountCode = CartService.cart.discountCodes.active[key].discountCode;
			var mainHeading = CartService.cart.discountCodes.active[key].mainHeading;

			var temp = '<p>' +
					   '<a class="deleteCartDiscountCodeButton remove close" data-discount-code="' + discountCode + '" title="Remove ' + mainHeading + ' Discount">&times;</a>' +
					   '<strong>' + discountCode + '</strong>: ' +
					   '<span>' + mainHeading + '</span>' +
					   '</p>';

			discountCodeRows += temp;
		}

		if ( discountCodeRows !== '' ) {
			rootElement.find('.cartDiscountCodes')[0].innerHTML = discountCodeRows;
			rootElement.find('.cartDiscountCodes').css({'display':''});
		} else {
			rootElement.find('.cartDiscountCodes').css({'display':'none'});
		}
	}

	function showExpiredDiscountUserAlerts() {

		for ( var i = 0; i < CartService.cart.discountCodes.expired.length; i++ ) {

			UserAlertService.showAlert( { type: 'error', 
										  message: '<strong>' + CartService.cart.discountCodes.expired[i] + '</strong> is now expired and has been removed.', 
										  target: 'aboveCartItems' } );
		}
	}

	function showEmployeeLogin( discountCode ) {

		if ( typeof discountCode !== 'undefined' ) {
			rootElement.find('.employeeLoginForm input[name=discountcode]').val( discountCode );
			rootElement.find('.employeeLoginForm').css({'display':''});
			rootElement.find('.employeeLoginForm input[name=d_u]').focus();
		} else {
			rootElement.find('.employeeLoginForm').css({'display':'none'});
			rootElement.find('.employeeLoginForm input[name=discountcode]').val('');
			rootElement.find('.employeeLoginForm input[name=d_u]').val('');
			rootElement.find('.employeeLoginForm input[name=d_p]').val('');
			rootElement.find('.employeeLoginForm input[name=e_n]').val('');
		}
	}



}( jQuery, wss.shoppingCart.cartService, wss.shoppingCart.customerService, wss.shoppingCart.userAlertService, wss.shoppingCart.progressSpinnerComponent ));
