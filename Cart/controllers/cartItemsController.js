


wss.shoppingCart.cartItemsController = ( function( $, CartService, CustomerService, SavedForLaterService, UtilityService, UserAlertService, ProgressSpinner ) {



	'use strict';



	if ( !wss.shoppingCart.isEnabled ) return;



	var rootElement = $('[data-wss-controller=cartItemsController]');
	var refreshAutoReorderOptions = false;
	var itemUpdateSpinnerDelay = 1;
	var autoSaveDelay = 750;
	var autoSaveTimeoutIds = {};
	var cartItemUpdateLocks = {};



	$(document).ready( initializeCartItems );

	function initializeCartItems() {
		updateCartItems( true );
		showProblematicItemUserAlerts();
	}



	/* Before setting up our event handlers in the normal fashion, we need to remove the click and change handlers bound to num-spinner button elements in template/site2012/lib/js/script.js since our handler behaves differently and we can't have the two worlds colliding. */
	rootElement.find('.num-spinner button').off('click');
	rootElement.find('.num-spinner input').off('change');

	$( CartService ).on( 'cartItemUpdate', cartItemUpdateHandler );
	$( CustomerService ).on( 'customerUpdate', customerUpdateHandler );

	rootElement.on( 'click', 'button.updateCartButton', updateCartHandler );
	rootElement.on( 'click', 'a.emptyCartButton', emptyCartHandler );
	rootElement.on( 'click', 'button.returnToCartFromPendingOrderButton', returnToCartFromPendingOrderHandler );
	rootElement.on( 'click', 'button.quantityButton', quantityChangeHandler );
	rootElement.on( 'keyup', 'input.quantityInput', quantityChangeHandler );
	rootElement.on( 'change', 'select.quantitySelect', quantityChangeHandler );
	rootElement.on( 'click', 'a.deleteCartItemButton', deleteCartItemHandler );
	rootElement.on( 'click', 'a.saveForLaterButton', saveForLaterHandler );

	function cartItemUpdateHandler() {

		updateCartItems();
		updateCartItemCount();
		showProblematicItemUserAlerts();
	}

	function customerUpdateHandler() {

		for ( var i = 0; i < CartService.cart.itemSortOrder.length; i++ ) {
			showCaliforniaDropShipFeeTag( CartService.cart.itemSortOrder[i] );
		}
	}

	function updateCartHandler( event ) {

		/* In the markup, the update cart button serves as a submit button for an enclosing form to provide functionality for non-JS browsers. We cancel that default form submit behavior here since we'll be handling this asynchronously for JS browsers. */ 
		event.preventDefault();

		if ( CartService.hasProblematicItem() ) return;

		if ( Object.keys(cartItemUpdateLocks).length ) return;
		lockCartItemUpdates();

		var progressSpinnerTargetElement = $(this).closest('.cartItems');
		var progressSpinnerTopRadiusTargetElement = progressSpinnerTargetElement.find('.cartItemsHeader');
		var progressSpinnerBottomRadiusTargetElement = progressSpinnerTargetElement.find('.ag-cart');

		var progressSpinnerId = ProgressSpinner.add( progressSpinnerTargetElement, progressSpinnerTopRadiusTargetElement, progressSpinnerBottomRadiusTargetElement );

		CartService.updateCart()
			.then(	function success() {
						unlockCartItemUpdates();
						ProgressSpinner.remove( progressSpinnerId );
					},
					function error() {
						unlockCartItemUpdates();
						ProgressSpinner.remove( progressSpinnerId );
						UserAlertService.showAlert( { type: 'error', 
													  message: 'There was an error updating your cart. Please try again.', 
													  target: 'aboveCartItems',
													  alertId: 'cartItemsError' } );
					});
	}

	function emptyCartHandler( event ) {
		
		/* In the markup, the empty cart button has an href to provide functionality for non-JS browsers. We cancel that default link behavior here since we'll be handling this asynchronously for JS browsers. */ 
		event.preventDefault();

		if ( Object.keys(cartItemUpdateLocks).length ) return;

		if( !confirm( 'Are you sure you want to empty your cart?' ) ) {
			return false;
		}

		lockCartItemUpdates();

		var progressSpinnerTargetElement = $(this).closest('.cartItems');
		var progressSpinnerTopRadiusTargetElement = progressSpinnerTargetElement.find('.cartItemsHeader');
		var progressSpinnerBottomRadiusTargetElement = progressSpinnerTargetElement.find('.ag-cart');

		var progressSpinnerId = ProgressSpinner.add( progressSpinnerTargetElement, progressSpinnerTopRadiusTargetElement, progressSpinnerBottomRadiusTargetElement );

		CartService.emptyCart()
			.then(	function success() {
						unlockCartItemUpdates();
						ProgressSpinner.remove( progressSpinnerId );
						UserAlertService.clearAlerts();
					},
					function error() {
						unlockCartItemUpdates();
						ProgressSpinner.remove( progressSpinnerId );
						UserAlertService.showAlert( { type: 'error', 
													  message: 'There was an error emptying your cart. Please try again.', 
													  target: 'aboveCartItems',
													  alertId: 'cartItemsError' } );
					});
	}

	function returnToCartFromPendingOrderHandler() {

		if ( Object.keys(cartItemUpdateLocks).length ) return;

		if( !confirm( 'Are you sure you want to save your pending order and return to your cart?' ) ) {
			return false;
		}

		lockCartItemUpdates();
		
		var progressSpinnerTargetElement = $(this).closest('.cartItems');
		var progressSpinnerTopRadiusTargetElement = progressSpinnerTargetElement.find('.cartItemsHeader');
		var progressSpinnerBottomRadiusTargetElement = progressSpinnerTargetElement.find('.ag-cart');

		var progressSpinnerId = ProgressSpinner.add( progressSpinnerTargetElement, progressSpinnerTopRadiusTargetElement, progressSpinnerBottomRadiusTargetElement );

		CartService.returnToCartFromPendingOrder()
			.then(	function success() {
						unlockCartItemUpdates();
						ProgressSpinner.remove( progressSpinnerId );
						UserAlertService.clearAlerts();
						updateCartItemHeader();
					},
					function error() {
						unlockCartItemUpdates();
						ProgressSpinner.remove( progressSpinnerId );
						UserAlertService.showAlert( { type: 'error', 
													  message: 'There was an error returning to your cart. Please try again.', 
													  target: 'aboveCartItems',
													  alertId: 'cartItemsError' } );
					});
	}

	function updateCartItemHandler( cartItemId ) {

		if ( cartItemUpdateLocks[cartItemId] || cartItemUpdateLocks['global'] ) return;
		lockCartItemUpdates( cartItemId );

		delete autoSaveTimeoutIds[cartItemId];

		var targetCartItem = rootElement.find( '.cartItemId_' + cartItemId );
		var quantitySelectWrapper = targetCartItem.find('.quantitySelectWrapper');
		var quantityInputWrapper = targetCartItem.find('.quantityInputWrapper');

		var progressSpinnerId;
		var progressSpinnerTargetElement;
		var targetQuantityElement;
		var hideQuantityText = false;

		if ( quantitySelectWrapper.is(':visible') ) {
			progressSpinnerTargetElement = quantitySelectWrapper;
			targetQuantityElement = targetCartItem.find('.quantitySelect');
		} else {
			progressSpinnerTargetElement = quantityInputWrapper;
			targetQuantityElement = targetCartItem.find('.quantityInput');
			hideQuantityText = true;
		}
		
		var timeoutId = setTimeout( function() {
										progressSpinnerId = ProgressSpinner.add( progressSpinnerTargetElement );
										if ( hideQuantityText ) targetQuantityElement.css({'color':'#ffffff'});
									}, itemUpdateSpinnerDelay );

		CartService.updateCart( cartItemId )
			.then(	function success() {
						unlockCartItemUpdates( cartItemId );
						clearTimeout( timeoutId );
						if ( progressSpinnerId ) ProgressSpinner.remove( progressSpinnerId );
						if ( hideQuantityText ) targetQuantityElement.css({'color':''});
					},
					function error() {
						unlockCartItemUpdates( cartItemId );
						clearTimeout( timeoutId );
						if ( progressSpinnerId ) ProgressSpinner.remove( progressSpinnerId );
						if ( hideQuantityText ) targetQuantityElement.css({'color':''});
						UserAlertService.showAlert( { type: 'error', 
													  message: 'There was an error updating your cart. Please try again.', 
													  target: 'aboveCartItems',
													  alertId: 'cartItemsError' } );
					});
	}

	function deleteCartItemHandler( event ) {
		
		/* In the markup, the delete button has an href to provide functionality for non-JS browsers. We cancel that default link behavior here since we'll be handling this asynchronously for JS browsers. */ 
		event.preventDefault();

		var cartItemId = $(this).closest('.cartItemWrapper').attr('data-cart-item-id');

		if ( cartItemUpdateLocks[cartItemId] || cartItemUpdateLocks['global'] ) return;
		lockCartItemUpdates( cartItemId );

		/* We want to show a spinner icon instead of the normal delete icon so the user knows we caught their click and we're doing something about it. *BUT* we only want to do that if the request takes more than a very short time to complete. If the request completes quickly, swapping out the icons will be unnecessary and will just look like a strange UI flicker to the user. */
		var timeoutId = setTimeout( function() {
										showDeleteCartItemButton( cartItemId, null, 'spinner' );
									}, itemUpdateSpinnerDelay );

		CartService.deleteCartItem( cartItemId )
			.then(	function success() {
						unlockCartItemUpdates( cartItemId );
						clearTimeout( timeoutId );
					},
					function error() {
						unlockCartItemUpdates( cartItemId );
						clearTimeout( timeoutId );
						showDeleteCartItemButton( cartItemId );
						UserAlertService.showAlert( { type: 'error', 
													  message: 'There was an issue removing this item from your cart. Please try again.', 
													  target: 'aboveCartItems',
													  alertId: 'cartItemsError' } );
					});
	}

	function quantityChangeHandler( event ) {
		
		/* In the markup, the quantity up/down buttons don't have a type="button". This allows them to submit the non-JS form to post quantity updates back to the server. We cancel that default form submission behavior here since we'll be handling this asynchronously for JS browsers. */ 
		event.preventDefault();

		/* We have three types of quantity change UI elements: a select element (.quantitySelect) and a text input element (.quantityInput) that can be edited directly or via up/down spinner buttons (.quantityButton), so we need to be able to handle three different types of quantity change events. When the user updates the value of a quantity select element, we'll receive a 'change' event. When the user updates the value of the quantity input directly, we'll receive a 'keyup' event. When the user updates the value of the quantity input via the spinner buttons, we'll receive a 'click' event. Once we pull the value of whichever quantity element triggered the handler, all subsequent processing is the same regardless of the event source. */

		var cartItemId = $(this).closest('.cartItemWrapper').attr('data-cart-item-id');
		var targetCartItem = rootElement.find( '.cartItemId_' + cartItemId );
		var newQuantity;
		var isSelectElement = false;

		if ( event.type === 'click' ) {

			/* The user has clicked one of the up/down arrows to either side of our quantity text input element. */

			if ( cartItemUpdateLocks[cartItemId] || cartItemUpdateLocks['global'] ) return;

			/* We're going to use the global handler for num-spinner buttons to avoid code duplication, even though it means reaching out into the global scope (which we'd rather not do). You can find window.numberSpinnerClickHandler() in /template/site2012/lib/js/script.js. */
			window.numberSpinnerClickHandler( this );

			newQuantity = parseInt( $(this).closest('.num-spinner').find('input').val() ) || 0;

		} else if ( event.type === 'keyup' ) {

			/* The user has manually changed the value of our quantity text input element. */

			if ( cartItemUpdateLocks[cartItemId] || cartItemUpdateLocks['global'] ) return;

			/* Ignore any non-numeric input ('' would be the most likely scenario). */
			if ( !parseInt( $(this).val() ) ) return;

			newQuantity = parseInt( $(this).val() ) || 0;

		} else if ( event.type === 'change' ) {

			/* The user has selected an option from our quantity select element. */

			if ( cartItemUpdateLocks[cartItemId] || cartItemUpdateLocks['global'] ) {
				$(this).val( CartService.getCartItemQuantity( cartItemId ) );
				return;
			}

			/* If they select 'other' from the quantity select element, we're switching to the number-spinner input element that will allow them to directly enter the desired quantity. */
			if ( $(this).val() === 'other' ) {
				showItemQuantity( cartItemId, targetCartItem, true );
				return;
			}

			newQuantity = parseInt( $(this).val() ) || 0;

			isSelectElement = true;

		} else {

			console.log('ERROR: Unrecognized quantity change event type.');
			return;
		}

		CartService.queueCartItemQuantityUpdate( cartItemId, newQuantity );

		showUpsellNotice( cartItemId, targetCartItem );
		showMinBuyNotice( cartItemId, targetCartItem );
		showMustBuyNotice( cartItemId, targetCartItem );

		/* If this item is a member of a purchasing group, we need to consider the display of minBuy violation notices for other group members. */
		if ( CartService.cart.items[cartItemId].purchasingGroupId !== 0 ) {

			var targetPurchasingGroupId = CartService.cart.items[cartItemId].purchasingGroupId;
			
			for ( var i = 0; i < CartService.cart.itemSortOrder.length; i++ ) {

				var thisCartItemId = CartService.cart.itemSortOrder[i];

				if ( thisCartItemId !== cartItemId
					 && CartService.cart.items[thisCartItemId].purchasingGroupId === targetPurchasingGroupId ) {
					showMinBuyNotice( thisCartItemId );
				}
			}
		}

		/* This is where we implement autosave on item quantity changes by queueing a call to updateCartItemHandler(). */
		if ( CartService.allowCartItemUpdate( cartItemId ) ) {

			/* We're going to execute the autosave update immediately if the user is selecting a quantity from a select element as it is safe to assume the quantity they selected is the quantity they want. However, we're going to delay the execution of an update to a quantity input element since it can take the user more than one event (click or keyup) to get their quantity right. For example, they might need to click the up arrow three times to get to their desired quantity or they may need to enter a multi-digit value in the input. */

			if ( isSelectElement ) {

				updateCartItemHandler( cartItemId );

			} else {

				/* Clear any pending autosaves from previous quantity change events for this item. */
				if ( autoSaveTimeoutIds[cartItemId] ) {
					clearTimeout( autoSaveTimeoutIds[cartItemId] );
					delete autoSaveTimeoutIds[cartItemId];
				}
				
				autoSaveTimeoutIds[cartItemId] = setTimeout( function() {
																updateCartItemHandler( cartItemId );
															 }, autoSaveDelay );
			}
		}
	}

	function saveForLaterHandler( event ) {
		
		/* There's something in the styles that forces us to place an empty href attribute on the <a> that serves as the trigger for this handler, so we have to prevent the browser from following that non-link. */ 
		event.preventDefault();

		var cartItemId = $(this).closest('.cartItemWrapper').attr('data-cart-item-id');

		if ( cartItemUpdateLocks[cartItemId] || cartItemUpdateLocks['global'] ) return;
		lockCartItemUpdates( cartItemId );

		/* We want to show a spinner icon instead of the normal pin icon that displays next to the "Save for Later" link so the user knows we caught their click and we're doing something about it. *BUT* we only want to do that if the request takes more than a very short time to complete. If the request completes quickly, swapping out the icons will be unnecessary and will just look like a strange UI flicker to the user. */
		var timeoutId = setTimeout( function() {
										showSaveForLaterButton( cartItemId, null, 'spinner' );
									}, itemUpdateSpinnerDelay );

		SavedForLaterService.moveCartItemToSavedForLater( CartService.cart.items[cartItemId].itemNumber.trim(), CartService.getCartItemQuantity(cartItemId) )
			.then(	function success( response ) {

						unlockCartItemUpdates( cartItemId );
						clearTimeout( timeoutId );
						showSaveForLaterButton( cartItemId );

						if ( response === 'MAXSIZE_ERROR' ) {

							UserAlertService.showAlert( { type: 'error', 
														  message: 'There was an issue saving this item for later. You can have a maximum of ' + 
														  		   SavedForLaterService.savedForLater.maxSize + 
														  		   ' items in your Saved for Later list.', 
														  target: 'aboveCartItems',
														  alertId: 'cartItemsError' } );

						} else {

							showSavedForLaterMessage( cartItemId );

							CartService.deleteCartItem( cartItemId )
								.then(	function success() {},
										function error() {
											showSavedForLaterMessage( cartItemId, null, 'hide' );
											UserAlertService.showAlert( { type: 'error', 
																		  message: 'There was an issue removing this item from your cart. Please try again.', 
																		  target: 'aboveCartItems',
																		  alertId: 'cartItemsError' } );
										});
						}

					},
					function error() {
						unlockCartItemUpdates( cartItemId );
						clearTimeout( timeoutId );
						showSaveForLaterButton( cartItemId );
						UserAlertService.showAlert( { type: 'error', 
													  message: 'There was an issue saving this item for later. Please try again.', 
													  target: 'aboveCartItems',
													  alertId: 'cartItemsError' } );
					});
	}



	function lockCartItemUpdates( cartItemId ) {

		if ( cartItemId ) {
			cartItemUpdateLocks[ cartItemId ] = true;
		} else {
			cartItemUpdateLocks[ 'global' ] = true;
		}
	}

	function unlockCartItemUpdates( cartItemId ) {

		if ( cartItemId ) {
			delete cartItemUpdateLocks[ cartItemId ];
		} else {
			delete cartItemUpdateLocks[ 'global' ];
		}
	}



	function updateCartItems( initialize ) {

		if ( initialize ) {

			for ( var i = 0; i < CartService.cart.itemSortOrder.length; i++ ) {
				updateCartItem( CartService.cart.itemSortOrder[i], true );
			}

		} else {

			for ( var i = 0; i < CartService.cartItemChanges.deleted.length; i++ ) {
				deleteCartItem( CartService.cartItemChanges.deleted[i] );
			}

			for ( var i = 0; i < CartService.cartItemChanges.added.length; i++ ) {
				addCartItem( CartService.cartItemChanges.added[i] );
			}

			for ( var i = 0; i < CartService.cartItemChanges.updated.length; i++ ) {
				updateCartItem( CartService.cartItemChanges.updated[i] );
			}
		}

		if ( refreshAutoReorderOptions ) {
			wss.autoReordersViewCartItem.createAllCartItemModules( $('.ag.ag-cart.box'), CustomerService.customer.userIndex );
			refreshAutoReorderOptions = false;
		}

		if ( CartService.cart.itemSortOrder.length === 0 ) {
			UserAlertService.clearAlerts();
			rootElement.find('.cartItems').css({'display':'none'});
			rootElement.find('.cartEmpty').css({'display':''});
		} else {
			rootElement.find('.cartEmpty').css({'display':'none'});
			rootElement.find('.cartItems').css({'display':''});
		}
	}

	function addCartItem( cartItemId ) {

		var newItem = rootElement.find('.cartItemId_cartItemTemplateRootItem').clone();
		var newItemSortOrderIndex = CartService.cart.itemSortOrder.indexOf( cartItemId );
		var newItemPlacementTarget;

		newItem.removeClass( 'cartItemId_cartItemTemplateRootItem' );
		newItem.addClass( 'cartItemId_' + cartItemId );
		newItem.attr( 'data-cart-item-id', cartItemId );
		newItem.attr( 'data-cart-item-number', CartService.cart.items[cartItemId].itemNumber.trim() );
		newItem.find( '.cartItem' ).attr( 'data-itemnumber', CartService.cart.items[cartItemId].itemNumber.trim() );
		newItem.find( '.cartItemSavedForLaterMessage' ).remove();

		if ( newItemSortOrderIndex === 0 ) {
			newItem.insertAfter( '.cartItemsSubHeader' );
		} else {
			newItem.insertAfter( '.cartItemId_' + CartService.cart.itemSortOrder[ newItemSortOrderIndex - 1 ] );
		}

		updateCartItem( cartItemId );
		newItem.css( {'display':''} );
	}

	function deleteCartItem( cartItemId ) {
		rootElement.find( '.cartItemId_' + cartItemId ).remove();
	}

	function updateCartItem( cartItemId, initialize ) {

		var targetCartItem = rootElement.find( '.cartItemId_' + cartItemId );

		showMinBuyNotice( cartItemId, targetCartItem ); //
		showMustBuyNotice( cartItemId, targetCartItem ); //
		showUpsellNotice( cartItemId, targetCartItem ); //
		showAutoReorderOptions( cartItemId, targetCartItem ); //

		/* On initial page load, we only want to evaluate cart line item elements that aren't fully rendered by CF on the server as part of the initial request. Having just done that above, we skip over everything that follows. We do this for performance reasons as there's no good reason to incur the performance hit of immediately reevaluating all of those elements that were just rendered by CF. Once the page is loaded and we're settled into dynamic UI land, all subsequent updates need to account for potential changes to all cart line item elements. */
		if ( !initialize ) {
			showItemImage( cartItemId, targetCartItem );
			showItemDescription( cartItemId, targetCartItem );
			showItemNumber( cartItemId, targetCartItem );
			showUneditableQuantityMessage( cartItemId, targetCartItem );
			showStockLevel( cartItemId, targetCartItem );
			showSaveForLaterButton( cartItemId, targetCartItem );
			showEstimatedShipTimeTag( cartItemId, targetCartItem );
			showSpecialOrderTag( cartItemId, targetCartItem );
			showCaliforniaDropShipFeeTag( cartItemId, targetCartItem );
			showCommonCarrierTag( cartItemId, targetCartItem );
			showProductUnavailableTag( cartItemId, targetCartItem );
			showTooLargeForLiftgateTag( cartItemId, targetCartItem );
			showFreeShippingTag( cartItemId, targetCartItem );
			showLinkedProductMessage( cartItemId, targetCartItem );
			showItemQuantity( cartItemId, targetCartItem );
			showItemPrice( cartItemId, targetCartItem );
			showItemTotal( cartItemId, targetCartItem );
			showSubItems( cartItemId, targetCartItem );
		}
	}

	function updateCartItemCount() {

		/* Note that we're reaching outside of our controller's DOM context here. This is where we update the cart item count in the page header. */ 
		$('#cartItemCountSpan')[0].textContent = CartService.cart.itemCount;
	}

	function updateCartItemHeader() {

		if ( CartService.cart.isPendingOrder ) {
			rootElement.find('.emptyCartButton').css({'display':'none'});
			rootElement.find('.returnToCartFromPendingOrderButton').css({'display':''});
		} else {
			rootElement.find('.returnToCartFromPendingOrderButton').css({'display':'none'});
			rootElement.find('.emptyCartButton').css({'display':''});
		}
	}



	function showProblematicItemUserAlerts() {

		var hasMinBuyError = false;
		var hasMustBuyError = false;

		if ( CartService.cart.invalidZipItems.length ) {
			UserAlertService.showAlert( { type: 'error', 
										  message: 'One or more products in your cart are not available in your area. Please remove them before checking out.', 
										  target: 'aboveCartItems',
										  timeToLive: -1,
										  alertId: 'invalidZipItemError' } );
		} else {
			UserAlertService.clearAlerts( 'invalidZipItemError' );
		}

		if ( CartService.cart.unavailableItems.length ) {
			UserAlertService.showAlert( { type: 'error', 
										  message: 'One or more products in your cart are not available at this time. Please remove them before checking out.', 
										  target: 'aboveCartItems',
										  timeToLive: -1,
										  alertId: 'unavailableItemError' } );
		} else {
			UserAlertService.clearAlerts( 'unavailableItemError' );
		}

		for ( var i = 0; i < CartService.cart.itemSortOrder.length; i++ ) {
			var cartItemId = CartService.cart.itemSortOrder[i];
			if ( CartService.showMinBuyNotice( cartItemId ) ) {
				hasMinBuyError = true;
				UserAlertService.showAlert( { type: 'error', 
											  message: 'One or more products in your cart require a minimum purchase quantity. Please correct them before checking out.',
											  target: 'aboveCartItems',
											  timeToLive: -1,
											  alertId: 'minBuyError' } );
				break;
			}
		}

		if ( !hasMinBuyError ) {
			UserAlertService.clearAlerts( 'minBuyError' );
		}

		for ( var i = 0; i < CartService.cart.itemSortOrder.length; i++ ) {
			var cartItemId = CartService.cart.itemSortOrder[i];
			if ( CartService.showMustBuyNotice( cartItemId ) ) {
				hasMustBuyError = true;
				UserAlertService.showAlert( { type: 'error', 
											  message: 'One or more products in your cart require a must purchase quantity. Please correct them before checking out.',
											  target: 'aboveCartItems',
											  timeToLive: -1,
											  alertId: 'mustBuyError' } );
				break;
			}
		}

		if ( !hasMustBuyError ) {
			UserAlertService.clearAlerts( 'mustBuyError' );
		}
	}

	function showItemImage( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.itemImage');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.itemImage');
		}

		if ( CartService.cart.items[cartItemId].productLink === ''
			 || CartService.cart.items[cartItemId].cartGroupType === 'quote' ) {
			targetCartItem.find('a')[0].href = '';
		} else {
			targetCartItem.find('a')[0].href = CartService.cart.items[cartItemId].productLink;
		}

		var targetItemImageElement = targetCartItem.find('img')[0];
		targetItemImageElement.src = CartService.cart.items[cartItemId].productThumbnail;
		targetItemImageElement.alt = CartService.cart.items[cartItemId].productAlt;
	}

	function showItemDescription( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.itemDescription');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.itemDescription');
		}

		if ( CartService.cart.items[cartItemId].cartGroupType === 'quote' ) {
			targetCartItem[0].textContent = CartService.cart.items[cartItemId].quoteName;
		} else if ( CartService.cart.items[cartItemId].cartGroupType === 'sample' ) {
			targetCartItem[0].innerHTML = '<a href="' + CartService.cart.items[cartItemId].productLink + '">' +
										  CartService.cart.items[cartItemId].quoteName +
										  '</a>';
		} else if ( CartService.cart.items[cartItemId].productLink !== '' ) {
			targetCartItem[0].innerHTML = '<a href="' + CartService.cart.items[cartItemId].productLink + '" title="' + CartService.cart.items[cartItemId].productAlt + '">' +
										  CartService.cart.items[cartItemId].productDescription +
										  '</a>';
		} else {
			targetCartItem[0].textContent = CartService.cart.items[cartItemId].productDescription;
		}
	}

	function showItemNumber( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.itemNumber');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.itemNumber');
		}

		if ( CartService.cart.items[cartItemId].cartGroupType !== 'quote'
			 && CartService.cart.items[cartItemId].cartGroupType !== 'sample'
			 && !CartService.cart.items[cartItemId].isMultiLengthSelectToolItem ) {
			targetCartItem[0].textContent = '#' + CartService.cart.items[cartItemId].itemNumber.trim() + ' - ' + CartService.cart.items[cartItemId].altUom;
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showUneditableQuantityMessage( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.uneditableQuantityMessage');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.uneditableQuantityMessage');
		}

		if ( CartService.cart.items[cartItemId].cartGroupType === 'quote'
			 || CartService.cart.items[cartItemId].cartGroupType === 'customItem'
			 || CartService.cart.items[cartItemId].cartGroupType === 'teabag'
			 || CartService.cart.items[cartItemId].isCustomItem
			 || CartService.cart.items[cartItemId].isOutletItem ) {
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showMinBuyNotice( cartItemId, targetCartItem ) {

		/* Some items have minBuy restrictions that require a customer to buy a certain minimum number of units. When the quantity of an item with a minBuy restriction falls below the required level we show an alert tag on the line item and add a red border around quantity select boxes to call attention to the problem. Those UI changes are managed here. */

		if ( targetCartItem instanceof jQuery === false ) {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId );
		}
	
		var targetMinBuyElement = targetCartItem.find('.minBuyTag');
		var minBuy = CartService.showMinBuyNotice( cartItemId );

		if ( minBuy > 0 ) {

			if ( CartService.cart.items[cartItemId].purchasingGroupId ) {
				targetMinBuyElement[0].innerHTML = 'You must purchase at least <span>' + minBuy + '</span> items in this group.';
				targetMinBuyElement[0].href = '/purchasing-group.cfm?i=' + CartService.cart.items[cartItemId].productPageItemNumber;
			} else {
				targetMinBuyElement[0].innerHTML = 'You must purchase at least <span>' + minBuy + '</span> of this item to continue.';
				targetMinBuyElement[0].href = '';
			}

			targetMinBuyElement.css({'display':''});
			targetCartItem.find('.quantityField').addClass('input_error');

		} else {

			targetMinBuyElement.css({'display':'none'});
			targetCartItem.find('.quantityField').removeClass('input_error');
		}
	}

	function showMustBuyNotice( cartItemId, targetCartItem ) {

		/* Some items have a mustBuy restriction that requires a customer to buy in even multiples of the mustBuy value. When we have a violation of that restriction, we show an alert tag on the line item and add a red border around quantity select boxes to call attention to the problem. Those UI changes are managed here. */

		if ( targetCartItem instanceof jQuery === false ) {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId );
		}
	
		var targetMustBuyElement = targetCartItem.find('.mustBuyTag');
		var mustBuy = CartService.showMustBuyNotice( cartItemId );

		/* We defer to the minBuy notice in situations where there are both minBuy and mustBuy violations, because showing both notices simultaneously can be confusing. That's why we include the check showMinBuyNotice() check here. */
		if ( mustBuy > 0
			 && !CartService.showMinBuyNotice( cartItemId ) ) {
			targetMustBuyElement[0].innerHTML = 'You must purchase a multiple of ' + mustBuy + ' of this item to continue.';
			targetMustBuyElement.css({'display':''});
			targetCartItem.find('.quantityField').addClass('input_error');
		} else {
			targetMustBuyElement.css({'display':'none'});
			targetCartItem.find('.quantityField').removeClass('input_error');
		}
	}

	function showStockLevel( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.stockLevel');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.stockLevel');
		}

		if ( CustomerService.customer.isPlatinum 
			 && CartService.cart.items[cartItemId].stockLevel !== '' 
			 && CartService.cart.items[cartItemId].cartGroupType !== 'quote'
			 && CartService.cart.items[cartItemId].cartGroupType !== 'sample'
			 && !CartService.cart.items[cartItemId].isGiftCard ) {
			targetCartItem.find('span')[0].textContent = CartService.cart.items[cartItemId].stockLevel;
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showSaveForLaterButton( cartItemId, targetCartItem, iconToShow ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.saveForLaterButton');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.saveForLaterButton');
		}

		if ( CartService.cart.items[cartItemId].showSavedForLater 
			 && CustomerService.customer.showSavedForLater ) {
			if ( iconToShow === 'spinner' ) {
				targetCartItem.find('.saveForLaterButtonIconPin').css({'display':'none'});
				targetCartItem.find('.saveForLaterButtonIconSpinner').css({'display':''});
			} else {
				targetCartItem.find('.saveForLaterButtonIconPin').css({'display':''});
				targetCartItem.find('.saveForLaterButtonIconSpinner').css({'display':'none'});
			}
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showEstimatedShipTimeTag( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.estimatedShipTimeTag');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.estimatedShipTimeTag');
		}

		if ( CartService.cart.items[cartItemId].estimatedShipTimeMessage !== '' ) {
			targetCartItem[0].textContent = CartService.cart.items[cartItemId].estimatedShipTimeMessage;
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showSpecialOrderTag( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.specialOrderTag');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.specialOrderTag');
		}

		if ( CartService.cart.items[cartItemId].isSpecialOrder ) {
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showCaliforniaDropShipFeeTag( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.californiaDropShipFeeTag');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.californiaDropShipFeeTag');
		}

		if ( CartService.cart.items[cartItemId].hasCaliforniaDropShipFee 
			 && CustomerService.customer.shipToState === 'CA' ) {
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showCommonCarrierTag( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.commonCarrierTag');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.commonCarrierTag');
		}

		var showCommonCarrier = CartService.showCommonCarrierTag( cartItemId );

		if ( showCommonCarrier ) {
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showProductUnavailableTag( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.productUnavailableTag');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.productUnavailableTag');
		}

		if ( CartService.cart.items[cartItemId].isInvalidZipItem 
			 || CartService.cart.items[cartItemId].isUnavailableItem ) {
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showTooLargeForLiftgateTag( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.tooLargeForLiftgateTag');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.tooLargeForLiftgateTag');
		}

		if ( CartService.cart.items[cartItemId].tooLargeForLiftgateUrl !== '' ) {
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showFreeShippingTag( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.freeShippingTag');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.freeShippingTag');
		}

		var showFreeShipping = CartService.showFreeShippingTag( cartItemId );

		if ( showFreeShipping ) {
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showLinkedProductMessage( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery === false ) {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId );
		}

		if ( CartService.cart.items[cartItemId].isLinkedProduct === 1 ) {
			targetCartItem.find('.cartItem').addClass('add-on');
		} else {
			targetCartItem.find('.cartItem').removeClass('add-on');
		}

		var targetLinkedProductMessage = targetCartItem.find('.linkedProductMessage');

		if ( CartService.cart.items[cartItemId].linkedProductMessage !== '' ) {
			targetLinkedProductMessage[0].textContent = CartService.cart.items[cartItemId].linkedProductMessage;
			targetLinkedProductMessage.css({'display':''});
		} else {
			targetLinkedProductMessage.css({'display':'none'});
		}
	}

	function showItemQuantity( cartItemId, targetCartItem, forceQuantityInput ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.itemQuantity');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.itemQuantity');
		}

		var itemQuantity = CartService.getCartItemQuantity( cartItemId );

		if ( CartService.cart.items[cartItemId].cartGroupType === 'quote'
			 || CartService.cart.items[cartItemId].cartGroupType === 'sample'
			 || CartService.cart.items[cartItemId].cartGroupType === 'teabag' ) {

			targetCartItem.find('.quantityStatic').css({'display':'none'});
			targetCartItem.find('.quantitySelectWrapper').css({'display':'none'});
			targetCartItem.find('.quantityInputWrapper').css({'display':'none'});

			targetCartItem.find('.quantitySelect').prop('disabled',true);
			targetCartItem.find('.quantityInput').prop('disabled',false);

		} else if ( CartService.cart.items[cartItemId].cartGroupType === 'customItem'
					|| CartService.cart.items[cartItemId].isCustomItem
					|| CartService.cart.items[cartItemId].isOutletItem
					|| CartService.cart.items[cartItemId].isGiftCard
					|| CartService.cart.items[cartItemId].isFreeItem ) {

			targetCartItem.find('.quantityStatic')[0].textContent = itemQuantity;

			targetCartItem.find('.quantityStatic').css({'display':''});
			targetCartItem.find('.quantitySelectWrapper').css({'display':'none'});
			targetCartItem.find('.quantityInputWrapper').css({'display':'none'});

			targetCartItem.find('.quantitySelect').prop('disabled',true);
			targetCartItem.find('.quantityInput').prop('disabled',false);

		} else if ( CartService.cart.items[cartItemId].purchasingGroupId === 0
					&& ( CartService.cart.items[cartItemId].minBuy > 1
						 || CartService.cart.items[cartItemId].mustBuy > 1 )
					&& itemQuantity <= CartService.cart.items[cartItemId].maxQuantitySelect
					&& !forceQuantityInput ) {

			var options = '';
			var currentQuantity;

			if ( itemQuantity < CartService.cart.items[cartItemId].minBuy ) {
				options += '<option value="' + itemQuantity + '" disabled selected>' + itemQuantity + '</option>';
			}

			for ( currentQuantity = CartService.cart.items[cartItemId].minBuy; 
				  currentQuantity <= CartService.cart.items[cartItemId].maxQuantitySelect; 
				  currentQuantity += CartService.cart.items[cartItemId].mustBuy ) {
				options += '<option value="' + currentQuantity + '" ' + ( currentQuantity === itemQuantity ? 'selected' : '' ) + '>' + currentQuantity + '</option>'
			}

			options += '<option value="other">Other</option>';
			targetCartItem.find('.quantitySelect')[0].innerHTML = options;

			targetCartItem.find('.quantityStatic').css({'display':'none'});
			targetCartItem.find('.quantitySelectWrapper').css({'display':''});
			targetCartItem.find('.quantityInputWrapper').css({'display':'none'});

			targetCartItem.find('.quantitySelect').prop('disabled',false);
			targetCartItem.find('.quantityInput').prop('disabled',true);

		} else {

			targetCartItem.find('.quantityInput').val( itemQuantity );

			targetCartItem.find('.quantityStatic').css({'display':'none'});
			targetCartItem.find('.quantitySelectWrapper').css({'display':'none'});
			targetCartItem.find('.quantityInputWrapper').css({'display':''});

			targetCartItem.find('.quantitySelect').prop('disabled',true);
			targetCartItem.find('.quantityInput').prop('disabled',false);
		}
	}

	function showUpsellNotice( cartItemId, targetCartItem ) {

		/* For items that offer quantity discounts, we sometimes display a little text promo blurb right under the quantity selector that tells the user how many additional units of the item they would need to buy to trigger the next tier of discount pricing. This is where we decide whether to show this promo for each cart item and update the UI accordingly. We only care about top-level items here (non-group items and cart group root items). */

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.upsellNotice');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.upsellNotice');
		}

		var upsellQuantity = CartService.showUpsellNotice( cartItemId );

		if ( upsellQuantity > 0 ) {
			targetCartItem.find('span')[0].textContent = upsellQuantity;
			targetCartItem.css({'display':''});
		} else {
			targetCartItem.css({'display':'none'});
		}
	}

	function showItemPrice( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.itemPrice');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.itemPrice');
		}

		if ( CartService.cart.items[cartItemId].price === 0 ) {
			targetCartItem[0].textContent = 'FREE';
		} else if ( CartService.cart.items[cartItemId].cartGroupType === 'quantityDiscount' ) {
			var itemPrice = '<p><span class="split-qty">' + 
							CartService.cart.items[cartItemId].qty + 
							'</span>&nbsp;' + 
							UtilityService.formatCurrency( CartService.cart.items[cartItemId].price ) + 
							'</p>';
			for ( var i = 0; i < CartService.cart.items[cartItemId].cartGroupSubItemIds.length; i++ ) {
				var subItemId = CartService.cart.items[cartItemId].cartGroupSubItemIds[i];
				itemPrice += '<p><span class="split-qty">' + 
							 CartService.cart.items[subItemId].qty + 
							 '</span>&nbsp;' + 
							 UtilityService.formatCurrency( CartService.cart.items[subItemId].price ) + 
							 '</p>';
			}
			targetCartItem[0].innerHTML = itemPrice;
		} else if ( CartService.cart.items[cartItemId].cartGroupType !== 'quote'
					&& !CartService.cart.items[cartItemId].isMultiLengthSelectToolItem ) {
			targetCartItem[0].textContent = UtilityService.formatCurrency( CartService.cart.items[cartItemId].price );
		} else {
			targetCartItem[0].textContent = '';
		}
	}

	function showItemTotal( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.itemTotal strong');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.itemTotal strong');
		}

		var itemTotal = CartService.getCartItemTotal( cartItemId );

		if ( itemTotal === 0 ) {
			targetCartItem[0].textContent = 'FREE';
		} else {
			targetCartItem[0].textContent = UtilityService.formatCurrency( itemTotal );
		}
	}

	function showDeleteCartItemButton( cartItemId, targetCartItem, iconToShow ) {

		if ( targetCartItem instanceof jQuery ) {
			targetCartItem = targetCartItem.find('.itemDelete');
		} else {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId ).find('.itemDelete');
		}

		if ( CartService.cart.items[cartItemId].isFreeItem ) {
			targetCartItem.find('.deleteCartItemButton').css({'display':'none'});
			targetCartItem.find('.deleteCartItemButtonIconSpinner').css({'display':'none'});
		} else if ( iconToShow === 'spinner' ) {
			targetCartItem.find('.deleteCartItemButton').css({'display':'none'});
			targetCartItem.find('.deleteCartItemButtonIconSpinner').css({'display':''});
		} else {
			targetCartItem.find('.deleteCartItemButton').css({'display':''});
			targetCartItem.find('.deleteCartItemButtonIconSpinner').css({'display':'none'});
		}
	}

	function showSubItems( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery === false ) {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId );
		}

		var currentSubItems = targetCartItem.find('.cartSubItem');

		if ( CartService.cart.items[cartItemId].cartGroupType === ''
			 || CartService.cart.items[cartItemId].cartGroupType === 'quantityDiscount' ) {

			if ( currentSubItems.length ) {
				currentSubItems.remove();
			}

			return;
		}

		var newSubItems = $();
		var subItemTemplate = rootElement.find('.cartItemId_cartItemTemplateRootItem').find('.cartSubItem');
		var cartGroupSubItemIds = CartService.cart.items[cartItemId].cartGroupSubItemIds.slice();

		if ( CartService.cart.items[cartItemId].cartGroupType === 'quote' ) {
			cartGroupSubItemIds.unshift( cartItemId );
		}

		for ( var i = 0; i < cartGroupSubItemIds.length; i++ ) {

			var subItemId = cartGroupSubItemIds[i];
			var newItem = subItemTemplate.clone();

			if ( CartService.cart.items[subItemId].cartGroupType === 'quote'
				 && CartService.cart.items[subItemId].productLink !== '' ) {
				var description = '<a class="description" href="' + CartService.cart.items[subItemId].productLink + '">' + 
								  CartService.cart.items[subItemId].productDescription + 
								  '</a>';
				newItem.find('.subItemDescription')[0].innerHTML = description;
			} else {
				newItem.find('.subItemDescription')[0].textContent = CartService.cart.items[subItemId].productDescription;
			}
			
			if ( CartService.cart.items[subItemId].cartGroupType === 'quote'
				 || CartService.cart.items[subItemId].productLink === 'sample' ) {
				newItem.find('.subItemQuantity p')[0].textContent = CartService.cart.items[subItemId].qty;
				newItem.find('.subItemQuantity').css({'display':''});
			} else {
				newItem.find('.subItemQuantity').css({'display':'none'});
			}
			
			if ( CartService.cart.items[subItemId].cartGroupType === 'quote'
				 && CartService.cart.items[subItemId].price === 0 ) {
				newItem.find('.subItemPrice')[0].textContent = 'FREE';
			} else if ( CartService.cart.items[subItemId].cartGroupType === 'quote' ) {
				newItem.find('.subItemPrice')[0].textContent = UtilityService.formatCurrency( CartService.cart.items[subItemId].price );
			} else if ( CartService.cart.items[subItemId].cartGroupType === 'accessory'
						|| CartService.cart.items[subItemId].cartGroupType === 'customItem'
						|| CartService.cart.items[subItemId].cartGroupType === 'teabag' ) {
				newItem.find('.subItemPrice')[0].textContent = UtilityService.formatCurrency( CartService.cart.items[subItemId].price );
			} else {
				newItem.find('.subItemPrice')[0].textContent = '';
			}

			if ( CartService.cart.items[subItemId].cartGroupType === 'sample'
				 || ( CartService.cart.items[subItemId].cartGroupType === 'quote'
				 	  && CartService.cart.items[subItemId].price === 0 ) ) {
				newItem.find('.subItemTotal strong')[0].textContent = 'FREE';
			} else if ( CartService.cart.items[subItemId].cartGroupType === 'quote' ) {
				newItem.find('.subItemTotal strong')[0].textContent = UtilityService.formatCurrency( CartService.cart.items[subItemId].price * CartService.cart.items[subItemId].qty );
			} else {
				newItem.find('.subItemTotal strong')[0].textContent = '';
			}

			newSubItems = newSubItems.add( newItem );
		}

		if ( currentSubItems.length ) {
			currentSubItems.remove();
		}

		if ( newSubItems.length ) {
			targetCartItem.append( newSubItems );
		}
	}

	function showAutoReorderOptions( cartItemId, targetCartItem ) {

		if ( targetCartItem instanceof jQuery === false ) {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId );
		}

		if ( CartService.cart.items[cartItemId].isAutoReorderItem
			 && CustomerService.customer.hasAutoReorderStagedItems
			 && wss.shoppingCart.autoReorderIsEnabled ) {

			var autoReorderOptions = rootElement.find( '.cartItemId_cartItemTemplateRootItem' ).find( '.autoReorderOptions' ).clone();
			autoReorderOptions.find( 'input[type=checkbox]' ).attr( 'id', 'autoreorder_' + CartService.cart.items[cartItemId].num );

			targetCartItem.attr( 'id', 'auto_reorder_' + CartService.cart.items[cartItemId].itemNumber.replace( /\s/g, '' ) );
			targetCartItem.addClass( 'ar-item' );
			targetCartItem.find( '.cartItem' ).after( autoReorderOptions );

			refreshAutoReorderOptions = true;

		} else {

			targetCartItem.find( '.autoReorderOptions' ).remove();
			targetCartItem.removeClass( 'ar-item' );
			targetCartItem.removeAttr( 'id' );
		}
	}

	function showSavedForLaterMessage( cartItemId, targetCartItem, displayState ) {

		if ( targetCartItem instanceof jQuery === false ) {
			targetCartItem = rootElement.find( '.cartItemId_' + cartItemId );
		}

		if ( displayState === 'hide' ) {

			targetCartItem.find('.cartItemSavedForLaterMessage').remove();
			targetCartItem.children().not('.cartItemSavedForLaterMessage').css({'display':''});

		} else {

			var savedForLaterMessage = rootElement.find( '.cartItemId_cartItemTemplateRootItem' ).find( '.cartItemSavedForLaterMessage' ).clone();
			targetCartItem.append( savedForLaterMessage );

			targetCartItem.children().not('.cartItemSavedForLaterMessage').css({'display':'none'});
		}
	}



}( jQuery, 
   wss.shoppingCart.cartService, 
   wss.shoppingCart.customerService, 
   wss.shoppingCart.savedForLaterService, 
   wss.shoppingCart.utilityService, 
   wss.shoppingCart.userAlertService,
   wss.shoppingCart.progressSpinnerComponent ));
