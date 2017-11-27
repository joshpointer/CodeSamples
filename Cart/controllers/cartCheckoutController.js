


wss.shoppingCart.cartCheckoutController = ( function( $, CartService, CustomerService, UtilityService, UserAlertService, GoogleAnalyticsService, CheckoutService, QuickCheckoutService ) {



	'use strict';



	if ( !wss.shoppingCart.isEnabled ) return;



	var rootElement = $('[data-wss-controller=cartCheckoutController]');



	$(document).ready( initializeCartCheckout );

	function initializeCartCheckout() {

		showCheckout();
		showCartSubtotal();
		showCheckoutButtons();
		showCartDiscountApplied();
		showThirdPartyPayments();
		showLeaseInformation();
		showWebPlusUpsell();
	}



	$( CartService ).on( 'pendingCartItemUpdate', pendingCartItemUpdateHandler );
	$( CartService ).on( 'cartItemUpdate', cartItemUpdateHandler );

	rootElement.on( 'click', '.standardCheckoutButton', standardCheckoutButtonHandler );
	rootElement.on( 'click', '.leasePaymentOptionInfoPopup', leaseInfoPopupHandler );

	function pendingCartItemUpdateHandler() {

		showCheckoutButtons();
	}

	function cartItemUpdateHandler() {

		showCheckout();
		showCartSubtotal();
		showCheckoutButtons();
		showCartDiscountApplied();
		showThirdPartyPayments();
		showLeaseInformation();
		showWebPlusUpsell();
		updateShipping();
	}

	function standardCheckoutButtonHandler() {
		
		GoogleAnalyticsService.cartCheckoutStandard();
	}

	function leaseInfoPopupHandler() {

		window.open( '/leasing_info.cfm', 
					 'cart_window_5', 
					 'toolbar=no,status=no,scrollbars=no,location=no,menubar=no,directories=no,resizaable=1,width=500,height=300' );

		return false;
	}



	function showCartDiscountApplied() {

		if ( CartService.cart.discountApplied > 0 ) {

			var netDiscountApplied = CartService.cart.discountApplied;
			var cartSubtotal = CartService.getCartSubtotal();
	
			if ( netDiscountApplied > cartSubtotal ) netDiscountApplied = cartSubtotal;
			
			if ( netDiscountApplied < CartService.cart.discountApplied ) {
				rootElement.find('.cartDiscountAppliedRow .unusedCreditMessage').css({'display':''});
			} else {
				rootElement.find('.cartDiscountAppliedRow .unusedCreditMessage').css({'display':'none'});
			}
			rootElement.find('.cartDiscountAppliedRow .subtotal').text( UtilityService.formatCurrency( netDiscountApplied ) );
			rootElement.find('.cartDiscountAppliedRow').css({'display':''});

		} else {

			rootElement.find('.cartDiscountAppliedRow').css({'display':'none'});
			rootElement.find('.cartDiscountAppliedRow .unusedCreditMessage').css({'display':'none'});
		}

		if ( CustomerService.customer.showQuickCheckout ) {
			rootElement.find('.cartCheckoutSidebar .cartDiscountAppliedRow').css({'display':'none'});
		}
	}

	function showCartSubtotal() {

		var cartSubtotal = CartService.getCartSubtotal();
		cartSubtotal = UtilityService.formatCurrency( cartSubtotal );
		rootElement.find('.cartSubtotalRow .subtotal').text( cartSubtotal );

		if ( CustomerService.customer.showQuickCheckout ) {
			rootElement.find('.cartCheckoutSidebar .cartSubtotalRow').css({'display':'none'});
		} else {
			rootElement.find('.cartCheckoutSidebar .cartSubtotalRow').css({'display':''});
		}
	}

	function showCheckout() {

		if ( CartService.cart.itemSortOrder.length === 0 ) {
			rootElement.css({'display':'none'});
		} else {
			rootElement.css({'display':''});
		}
	}

	function showCheckoutButtons() {

		if ( CartService.hasProblematicItem() ) {
			rootElement.find('.checkoutButtonWrapper').css({'display':'none'});
		} else {
			rootElement.find('.checkoutButtonWrapper').css({'display':''});
		}
	}

	function showLeaseInformation() {

		if ( CartService.cart.canFinance && CustomerService.customer.isDomestic ) {

			var summary = '';

			if ( CartService.getCartSubtotal() >= CartService.cart.financeMinimum ) {

				summary = 'Lease your order as low as <span class="payment-options__pricing">' + 
						  UtilityService.formatCurrency( CartService.cart.financeMonthlyPayment ) + 
						  '</span> / month';
				rootElement.find('.leasePaymentOptionForm').css({'display':''});

			} else {

				summary = 'Orders of ' + 
						  UtilityService.formatCurrency( CartService.cart.financeMinimum ) + 
						  ' or more can be financed for as low as <span class="payment-options__pricing">' + 
						  UtilityService.formatCurrency( CartService.cart.financeMonthlyPayment ) + 
						  '</span> / month';
				rootElement.find('.leasePaymentOptionForm').css({'display':'none'});
			}

			rootElement.find('.leasePaymentOptionSummary').html( summary );
			rootElement.find('.leasePaymentOptionWrapper').css({'display':''});

		} else {

			rootElement.find('.leasePaymentOptionForm').css({'display':'none'});
			rootElement.find('.leasePaymentOptionWrapper').css({'display':'none'});
		}
	}

	function showThirdPartyPayments() {

		if ( CartService.hasProblematicItem()
			 || ( !CustomerService.customer.isDomestic 
			 	  && CustomerService.customer.shipToCountry !== 'CA' 
			 	  && CustomerService.customer.shipToCountry !== 'PR' ) ) {
			rootElement.find('.thirdPartyPaymentsWrapper').css({'display':'none'});
		} else {
			rootElement.find('.thirdPartyPaymentsWrapper').css({'display':''});
		}
	}

	function showWebPlusUpsell() {

		if ( CartService.cart.subtotal >= 29 && CustomerService.customer.webPlusEligible ) {
			rootElement.find('.webPlusEligibleUpsell').css({'display':''});
			rootElement.find('.webPlusEnrolledUpsell').css({'display':'none'});
		} else if ( CartService.cart.subtotal < 29 
					&& CustomerService.customer.webPlusEnrolled 
					&& CustomerService.customer.webPlusShipToSelected ) {
			rootElement.find('.webPlusEligibleUpsell').css({'display':'none'});
			rootElement.find('.webPlusEnrolledUpsell').css({'display':''});
			rootElement.find('.webPlusUpsellAmount')[0].textContent = UtilityService.formatCurrency( 29 - CartService.cart.subtotal );
		} else {
			rootElement.find('.webPlusEligibleUpsell').css({'display':'none'});
			rootElement.find('.webPlusEnrolledUpsell').css({'display':'none'});
		}
	}

	function updateShipping() {

		/* There is a timing dependency between loading the quick checkout feature and loading the checkout shipping options. Quick checkout has to load first to function properly. So we give the quick checkout controller the lead when reloading the shipping options after a cart model update, so it can hold off on the call to updateShipping() until it has its own house in order. This backup call to updateShipping() refreshes shipping options in situations where quick checkout isn't active. */
		if ( !QuickCheckoutService.showQuickCheckout()
			 && !CartService.cartItemUpdateInProgress() ) {
			CheckoutService.updateShipping();
		}
	}



}( jQuery, 
   wss.shoppingCart.cartService, 
   wss.shoppingCart.customerService, 
   wss.shoppingCart.utilityService, 
   wss.shoppingCart.userAlertService, 
   wss.shoppingCart.googleAnalyticsService,
   wss.shoppingCart.checkoutService,
   wss.shoppingCart.quickCheckoutService ));
