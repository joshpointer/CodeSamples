


wss.shoppingCart.cartService = ( function( $, cartPreloadData, UtilityService, GoogleAnalyticsService ) {

	'use strict';

	var service = {};
	var pendingCartItemUpdates = {};
	var cartItemUpdatesInProgressCount = 0;
	
	service.cart = cartPreloadData || {};
	service.cartItemChanges = { 'added': [],
								'updated': [],
								'deleted': [] };

	service.addCartItems = function( itemsToAdd ) {

		cartItemUpdatesInProgressCount++;

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  data: { 'itemsToAdd': JSON.stringify(itemsToAdd) },
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/addcartitems/' } )
		.then(	function success( response ) {
					service.cartItemChanges = service.getCartItemChanges( response );
					service.cart = $.extend( true, {}, response );
					cartItemUpdatesInProgressCount--;
					$(service).trigger('cartItemUpdate');
					promiseObj.resolve();
				},
				function error() {
					console.log('ERROR: cartService.addCartItems()');
					cartItemUpdatesInProgressCount--;
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.updateCart = function( cartItemId ) {

		cartItemUpdatesInProgressCount++;

		var promiseObj = $.Deferred();
		var cartItems = [];

		if ( Object.keys( pendingCartItemUpdates ).length === 0 ) {
			cartItemUpdatesInProgressCount--;
			return promiseObj.resolve().promise();
		}

		if ( typeof cartItemId !== 'undefined' ) {

			/* If cartItemId has a value, we're updating that single cart item. */

			var cartItem = { 'cartItemId': cartItemId,
							 'num': service.cart.items[cartItemId].num.trim(),
							 'quantity': service.getCartItemQuantity( cartItemId ),
							 'cartGroupType': service.cart.items[cartItemId].cartGroupType,
							 'quoteNumber': service.cart.items[cartItemId].quoteNumber,
							 'itemNumber': service.cart.items[cartItemId].itemNumber.trim() };

			cartItems.push( cartItem );

		} else {

			/* If cartItemId does not have a value, we're updating all cart items with pending changes. */

			for ( var thisCartItemId in pendingCartItemUpdates ) {

				cartItem = { 'cartItemId': thisCartItemId,
							 'num': service.cart.items[thisCartItemId].num.trim(),
							 'quantity': service.getCartItemQuantity( thisCartItemId ),
							 'cartGroupType': service.cart.items[thisCartItemId].cartGroupType,
							 'quoteNumber': service.cart.items[thisCartItemId].quoteNumber,
							 'itemNumber': service.cart.items[thisCartItemId].itemNumber.trim() };

				cartItems.push( cartItem );
			}
		}

		$.ajax( { cache: false,
				  data: { 'cartItems': JSON.stringify(cartItems) },
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/updatecart/' } )
		.then(	function success( response ) {
					service.cartItemChanges = service.getCartItemChanges( response );
					for ( var i = 0; i < cartItems.length; i++ ) {
						delete pendingCartItemUpdates[ cartItems[i].cartItemId ];
					}
					service.cart = $.extend( true, {}, response );
					cartItemUpdatesInProgressCount--;
					$(service).trigger('cartItemUpdate');
					promiseObj.resolve();
				},
				function error() {
					console.log('ERROR: cartService.updateCart()');
					cartItemUpdatesInProgressCount--;
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.emptyCart = function() {

		cartItemUpdatesInProgressCount++;

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/emptycart/' } )
		.then(	function success( response ) {
					service.cartItemChanges = service.getCartItemChanges( response );
					pendingCartItemUpdates = {};
					service.cart = $.extend( true, {}, response );
					cartItemUpdatesInProgressCount--;
					$(service).trigger('cartItemUpdate');
					promiseObj.resolve();
				},
				function error() {
					console.log('ERROR: cartService.emptyCart()');
					cartItemUpdatesInProgressCount--;
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.deleteCartItem = function( cartItemId ) {

		cartItemUpdatesInProgressCount++;

		var promiseObj = $.Deferred();

		var data = { 'itemNumber': service.cart.items[cartItemId].itemNumber.trim(),
					 'num': service.cart.items[cartItemId].num.trim(),
					 'cartGroupType': service.cart.items[cartItemId].cartGroupType,
					 'quoteNumber': service.cart.items[cartItemId].quoteNumber };

		var googleAnalyticsItemData = { 'id': service.cart.items[cartItemId].itemNumber.trim(),
										'name': service.cart.items[cartItemId].description,
										'category': service.cart.items[cartItemId].webCategory,
										'brand': service.cart.items[cartItemId].vendorName,
										'price': service.cart.items[cartItemId].price,
										'qty': service.cart.items[cartItemId].qty };

		$.ajax( { cache: false,
				  data: data,
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/deletecartitem/' } )
		.then(	function success( response ) {
					GoogleAnalyticsService.cartItemDelete( googleAnalyticsItemData );
					service.cartItemChanges = service.getCartItemChanges( response );
					delete pendingCartItemUpdates[ cartItemId ];
					service.cart = $.extend( true, {}, response );
					cartItemUpdatesInProgressCount--;
					$(service).trigger('cartItemUpdate');
					promiseObj.resolve();
				},
				function error() {
					console.log('ERROR: cartService.deleteCartItem()');
					cartItemUpdatesInProgressCount--;
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.returnToCartFromPendingOrder = function() {

		cartItemUpdatesInProgressCount++;

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/returntocartfrompendingorder/' } )
		.then(	function success( response ) {
					service.cartItemChanges = service.getCartItemChanges( response );
					pendingCartItemUpdates = {};
					service.cart = $.extend( true, {}, response );
					cartItemUpdatesInProgressCount--;
					$(service).trigger('cartItemUpdate');
					promiseObj.resolve();
				},
				function error() {
					console.log('ERROR: cartService.returnToCartFromPendingOrder()');
					cartItemUpdatesInProgressCount--;
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.cartItemUpdateInProgress = function() {

		return cartItemUpdatesInProgressCount;
	}

	service.getCartItemChanges = function( newCart ) {

		var cartItemChanges = { 'added': [],
								'updated': [],
								'deleted': [] };

		// Any items in the old cart but not in the new cart need to be deleted.
		for ( var i = 0; i < service.cart.itemSortOrder.length; i++ ) {

			var cartItemId = service.cart.itemSortOrder[i];

			if ( newCart.itemSortOrder.indexOf( cartItemId ) === -1 ) {
				cartItemChanges.deleted.push( cartItemId );
			}
		}

		for ( var i = 0; i < newCart.itemSortOrder.length; i++ ) {

			var cartItemId = newCart.itemSortOrder[i];

			// Any items in the new cart but not in the old cart need to be added.
			if ( service.cart.itemSortOrder.indexOf( cartItemId ) === -1 ) {
				cartItemChanges.added.push( cartItemId );
				continue;
			}

			// Any items in both the old cart and the new cart with differences need to be updated.
			if ( !UtilityService.objectsAreEqual( newCart.items[cartItemId], service.cart.items[cartItemId] ) ) {
				cartItemChanges.updated.push( cartItemId );
			}
		}

		return cartItemChanges;
	}

	service.getCartItemTotal = function( cartItemId ) {

		var total = service.cart.items[cartItemId].price * service.cart.items[cartItemId].qty;

		for ( var i = 0; i < service.cart.items[cartItemId].cartGroupSubItemIds.length; i++ ) {
			var subItemId = service.cart.items[cartItemId].cartGroupSubItemIds[i];
			total += service.cart.items[subItemId].price * service.cart.items[subItemId].qty;
		}

		return total;
	}

	service.getCartItemQuantity = function( cartItemId, ignorePendingUpdates ) {

		/* For most cart items, it's very simple: the quantity of the item in the model is the quantity to be used for UI purposes. But quantityDiscount group members (a single item with multiple tiers of quantity/price based on quantity discounts) are represented in the model as multiple cart items, so we need to aggregate the quantities of those multiple group members into a single value for most of our needs (for example, populating the quantity element or calculating min/must buy restriction violations). So that happens here. If we're pulling our quantity from pendingCartItemUpdates, that aggregation has already occurred and we can just pull the value. */

		var quantity;

		if ( !ignorePendingUpdates && typeof pendingCartItemUpdates[cartItemId] !== 'undefined' ) {

			quantity = pendingCartItemUpdates[cartItemId];

		} else {

			quantity = service.cart.items[cartItemId].qty;

			if ( service.cart.items[cartItemId].cartGroupType === 'quantityDiscount' ) {
				for ( var i = 0; i < service.cart.items[cartItemId].cartGroupSubItemIds.length; i++ ) {
					var subItemId = service.cart.items[cartItemId].cartGroupSubItemIds[i];
					quantity += service.cart.items[subItemId].qty;
				}
			}

		}

		return quantity;
	}

	service.queueCartItemQuantityUpdate = function( cartItemId, newQuantity ) {

		if ( newQuantity === service.getCartItemQuantity( cartItemId, true ) ) {
			delete pendingCartItemUpdates[cartItemId];
		} else {
			pendingCartItemUpdates[cartItemId] = newQuantity;
		}

		$(service).trigger('pendingCartItemUpdate');
	}

	service.allowCartItemUpdate = function( cartItemId ) {

		var pendingQuantity = service.getCartItemQuantity( cartItemId );
		var quantity = service.getCartItemQuantity( cartItemId, true );

		if ( pendingQuantity !== quantity 
			 && !service.showMinBuyNotice( cartItemId )
			 && !service.showMustBuyNotice( cartItemId ) ) {
			return true;
		}

		return false;
	}

	service.getPurchasingGroupQuantity = function( purchasingGroupId ) {

		/* Purchasing groups are collections of items that share a minBuy requirement such that if the total quantity of all items in the group equals or exceeds the group's minBuy requirement, it's OK for the quantity of any individual item within the group to be below the minBuy. We calculate the aggregate quantity of a given purchasing group here. We only consider top-level items (non-group items and cart group root items) in our calculations. */

		var purchasingGroupQuantity = 0;

		for ( var i = 0; i < service.cart.itemSortOrder.length; i++ ) {

			var cartItemId = service.cart.itemSortOrder[i];

			if ( service.cart.items[cartItemId].purchasingGroupId === purchasingGroupId ) {
				purchasingGroupQuantity += service.getCartItemQuantity( cartItemId );
			}
		}

		return purchasingGroupQuantity;
	}

	service.getCartSubtotal = function() {

		var cartSubtotal = 0;

		for ( var cartItemId in service.cart.items ) {
			cartSubtotal += service.cart.items[cartItemId].price * service.cart.items[cartItemId].qty;
		}

		return cartSubtotal;
	}

	service.hasProblematicItem = function() {

		if ( service.cart.invalidZipItems.length || service.cart.unavailableItems.length ) {
			return true;
		}

		/* Check for minBuy and mustBuy violations. */
		for ( var i = 0; i < service.cart.itemSortOrder.length; i++ ) {
			var cartItemId = service.cart.itemSortOrder[i];
			if ( service.showMinBuyNotice( cartItemId ) || service.showMustBuyNotice( cartItemId ) ) return true;
		}

		return false;
	}

	service.showCommonCarrierTag = function( cartItemId ) {

		/* If this item or any item in its cart group isCommonCarrier, show the common carrier tag. */

		var showCommonCarrier = service.cart.items[cartItemId].isCommonCarrier;

		if ( !showCommonCarrier ) {
			for ( var i = 0; i < service.cart.items[cartItemId].cartGroupSubItemIds.length; i++ ) {
				 var subItemId = service.cart.items[cartItemId].cartGroupSubItemIds[i];
				 if ( service.cart.items[subItemId].isCommonCarrier === 1 ) {
				 	showCommonCarrier = 1;
				 	break;
				 }
			}
		}

		return showCommonCarrier;
	}

	service.showFreeShippingTag = function( cartItemId ) {

		/* If this item and every item in its cart group is free shipping, show the free shipping tag. */

		var showFreeShipping = service.cart.items[cartItemId].isFreeShipping;

		if ( showFreeShipping ) {
			for ( var i = 0; i < service.cart.items[cartItemId].cartGroupSubItemIds.length; i++ ) {
				 var subItemId = service.cart.items[cartItemId].cartGroupSubItemIds[i];
				 if ( service.cart.items[subItemId].isFreeShipping === 0 ) {
				 	showFreeShipping = 0;
				 	break;
				 }
			}
		}

		return showFreeShipping;
	}

	service.showMinBuyNotice = function( cartItemId ) {

		var minBuy = service.cart.items[cartItemId].minBuy;
		var quantity;

		if ( service.cart.items[cartItemId].purchasingGroupId !== 0 ) {
			quantity = service.getPurchasingGroupQuantity( service.cart.items[cartItemId].purchasingGroupId );
		} else {
			quantity = service.getCartItemQuantity( cartItemId );
		}

		if ( quantity > 0 && minBuy > 1 && quantity < minBuy ) {
			return minBuy;
		}

		return 0;
	}

	service.showMustBuyNotice = function( cartItemId ) {

		var mustBuy = service.cart.items[cartItemId].mustBuy;
		var quantity = service.getCartItemQuantity( cartItemId );

		if ( quantity > 0 && mustBuy > 1 && quantity % mustBuy !== 0 ) {
			return mustBuy;
		}

		return 0;
	}

	service.showUpsellNotice = function( cartItemId ) {

		var cartItemQuantity = service.getCartItemQuantity( cartItemId );
		var upsellQuantity = 0;

		for ( var i = 0; i < service.cart.items[cartItemId].upsellQuantityThresholds.length; i++ ) {

			var currentThreshold = service.cart.items[cartItemId].upsellQuantityThresholds[i];

			/* We only want to consider the first quantity discount threshold we find that is greater than the current item quantity, and we only want to show the promo blurb if the current item quantity is (1) one less than the discount threshold or (2) within 25% or the discount threshold. In other words, we only want to show the promo if the current quantity is reasonably close to the next discount tier. */

			if ( currentThreshold > cartItemQuantity 
				 && ( (currentThreshold-cartItemQuantity)/currentThreshold <= 0.25 || cartItemQuantity+1 === currentThreshold ) ) {

				upsellQuantity = currentThreshold - cartItemQuantity;
				break;
			}
		}

		return upsellQuantity;
	}

	service.applyGiftCardDiscountCode = function( discountCode ) {

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  data: { 'discountCode': discountCode },
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/applygiftcarddiscountcode/' } )
		.then(	function success( response ) {
					/* The gift card service returns only a message meant to be passed directly on to the user. If the gift card was successfully applied, that message will contain the amount applied, including a $ sign. If there was a problem, the message will not include that $ sign. So the presence or absence of a $ sign in the response message is the basis upon which we distinguish an error message from a success message. */
					var userAlertType = response.indexOf('$') !== -1 ? 'success' : 'error';
					promiseObj.resolve( response, userAlertType );
				},
				function error() {
					console.log('ERROR: cartService.applyGiftCardDiscountCode()');
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.applyQuoteDiscountCode = function() {

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/applyquotediscountcode/' } )
		.then(	function success() {
					promiseObj.resolve();
				},
				function error() {
					console.log('ERROR: cartService.applyQuoteDiscountCode()');
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.applyDiscountCode = function( discountCode, d_u, d_p, e_n ) {

		cartItemUpdatesInProgressCount++;

		var promiseObj = $.Deferred();

		var data = { 'discountCode': discountCode };

		if ( typeof d_u !== 'undefined' && d_u !== '' ) data.d_u = d_u;
		if ( typeof d_p !== 'undefined' && d_p !== '' ) data.d_p = d_p;
		if ( typeof e_n !== 'undefined' && e_n !== '' ) data.e_n = e_n;

		$.ajax( { cache: false,
				  data: data,
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/applydiscountcode/' } )
		.then(	function success( response ) {
					if ( typeof response.cart !== 'undefined' ) {
						service.cartItemChanges = service.getCartItemChanges( response.cart );
						pendingCartItemUpdates = {};
						service.cart = $.extend( true, {}, response.cart );
						cartItemUpdatesInProgressCount--;
						$(service).trigger('cartItemUpdate');
					}
					promiseObj.resolve( response );
				},
				function error() {
					console.log('ERROR: cartService.applyDiscountCode()');
					cartItemUpdatesInProgressCount--;
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.deleteDiscountCode = function( discountCode ) {

		cartItemUpdatesInProgressCount++;

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  data: { 'discountCode': discountCode },
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/deletediscountcode/' } )
		.then(	function success( response ) {
					service.cartItemChanges = service.getCartItemChanges( response );
					pendingCartItemUpdates = {};
					service.cart = $.extend( true, {}, response );
					cartItemUpdatesInProgressCount--;
					$(service).trigger('cartItemUpdate');
					promiseObj.resolve();
				},
				function error() {
					console.log('ERROR: cartService.deleteDiscountCode()');
					cartItemUpdatesInProgressCount--;
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	return service;

}( jQuery, wss.shoppingCart.cartPreloadData, wss.shoppingCart.utilityService, wss.shoppingCart.googleAnalyticsService ));
