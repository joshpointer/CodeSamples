


wss.shoppingCart.savedForLaterController = ( function( $, SavedForLaterService, CustomerService, UtilityService, UserAlertService, CartService, ProgressSpinner ) {



	'use strict';



	if ( !wss.shoppingCart.isEnabled ) return;



	var rootElement = $('[data-wss-controller=savedForLaterController]');
	var lockDataUpdates = false;
	var itemUpdateSpinnerDelay = 1;



	$(document).ready( initializeSavedForLater );

	function initializeSavedForLater() {

		if ( !CustomerService.customer.showSavedForLater ) return false;

		SavedForLaterService.getSavedForLater();
	}



	$( SavedForLaterService ).on( 'savedForLaterUpdate', savedForLaterUpdateHandler );

	rootElement.on( 'click', 'button.deleteAllSavedForLaterItemsButton', deleteAllSavedForLaterItemsHandler );
	rootElement.on( 'click', 'button.moveAllSavedForLaterItemsToCartButton', moveAllSavedForLaterItemsToCartHandler );
	rootElement.on( 'click', 'a.moveItemToCartButton', moveItemToCartHandler );
	rootElement.on( 'click', 'a.deleteItemButton', deleteItemHandler );
	rootElement.on( 'click', 'a[data-target-results-page]', changeResultsPageHandler );

	function savedForLaterUpdateHandler() {
		showSavedForLater();
	}

	function moveAllSavedForLaterItemsToCartHandler() {

		if ( lockDataUpdates ) return;
		lockDataUpdates = true;

		var itemsToAdd = [];
		var wishlistItemId;
		var itemNumber;
		var quantity;

		for ( var i = 0; i < SavedForLaterService.savedForLater.itemSortOrder.length; i++ ) {
			wishlistItemId = SavedForLaterService.savedForLater.itemSortOrder[i];
			itemNumber = SavedForLaterService.savedForLater.items[ 'id_' + wishlistItemId ].itemNumber.trim();
			quantity = SavedForLaterService.savedForLater.items[ 'id_' + wishlistItemId ].quantity;
			itemsToAdd.push( { 'itemNumber': itemNumber, 'quantity': quantity } );
		}

		var progressSpinnerTargetElement = $(this).closest('.savedForLaterItems');
		var progressSpinnerTopRadiusTargetElement = progressSpinnerTargetElement.find('.savedForLaterItemsHeader');
		var progressSpinnerBottomRadiusTargetElement = progressSpinnerTargetElement.find('.ag-cart');

		var progressSpinnerId = ProgressSpinner.add( progressSpinnerTargetElement, progressSpinnerTopRadiusTargetElement, progressSpinnerBottomRadiusTargetElement );

		CartService.addCartItems( itemsToAdd )
			.then(	function success() {

						lockDataUpdates = false;
						ProgressSpinner.remove( progressSpinnerId );
						showAllItemsMovedToCartMessage();

						SavedForLaterService.deleteAllSavedForLaterItems()
							.then(	function success() {
										showAllItemsMovedToCartMessage( 'hide' );
									},
									function error() {
										showAllItemsMovedToCartMessage( 'hide' );
										UserAlertService.showAlert( { type: 'error', 
																	  message: 'There was an issue removing these items from Saved for Later. Please try again.', 
																	  target: 'aboveSavedForLater',
																	  alertId: 'savedForLaterError' } );
									});

					},
					function error() {
						lockDataUpdates = false;
						ProgressSpinner.remove( progressSpinnerId );
						UserAlertService.showAlert( { type: 'error', 
													  message: 'There was an issue moving these items to your cart. Please try again.', 
													  target: 'aboveSavedForLater',
													  alertId: 'savedForLaterError' } );
					});
	}

	function moveItemToCartHandler( event ) {

		event.preventDefault();

		if ( lockDataUpdates ) return;
		lockDataUpdates = true;

		var wishlistItemId = $(this).closest('.savedForLaterItem').attr('data-wishlist-item-id');

		var itemNumber = SavedForLaterService.savedForLater.items[ 'id_' + wishlistItemId ].itemNumber.trim();
		var quantity = SavedForLaterService.savedForLater.items[ 'id_' + wishlistItemId ].quantity;
		var itemsToAdd = [ { 'itemNumber': itemNumber, 'quantity': quantity } ];

		var timeoutId = setTimeout( function() {
										showMoveItemToCartButton( wishlistItemId, 'spinner' );
									}, itemUpdateSpinnerDelay );

		CartService.addCartItems( itemsToAdd )
			.then(	function success() {

						lockDataUpdates = false;
						clearTimeout( timeoutId );
						showMoveItemToCartButton( wishlistItemId );

						showItemMovedToCartMessage( wishlistItemId );

						SavedForLaterService.deleteSavedForLaterItem( wishlistItemId )
							.then(	function success() {},
									function error() {
										showItemMovedToCartMessage( wishlistItemId, 'hide' );
										UserAlertService.showAlert( { type: 'error', 
																	  message: 'There was an issue removing an item from Saved for Later. Please try again.', 
																	  target: 'aboveSavedForLater',
																	  alertId: 'savedForLaterError' } );
									});

					},
					function error() {
						lockDataUpdates = false;
						clearTimeout( timeoutId );
						showMoveItemToCartButton( wishlistItemId );
						UserAlertService.showAlert( { type: 'error', 
													  message: 'There was an issue moving this item to your cart. Please try again.', 
													  target: 'aboveSavedForLater',
													  alertId: 'savedForLaterError' } );
					});
	}

	function deleteAllSavedForLaterItemsHandler() {

		if ( lockDataUpdates ) return;

		if( !confirm( 'Are you sure you want to remove all Saved for Later items?' ) ) {
			return false;
		}

		lockDataUpdates = true;

		var progressSpinnerTargetElement = $(this).closest('.savedForLaterItems');
		var progressSpinnerTopRadiusTargetElement = progressSpinnerTargetElement.find('.savedForLaterItemsHeader');
		var progressSpinnerBottomRadiusTargetElement = progressSpinnerTargetElement.find('.ag-cart');

		var progressSpinnerId = ProgressSpinner.add( progressSpinnerTargetElement, progressSpinnerTopRadiusTargetElement, progressSpinnerBottomRadiusTargetElement );

		SavedForLaterService.deleteAllSavedForLaterItems()
			.then(	function success() {
						lockDataUpdates = false;
					},
					function error() {
						lockDataUpdates = false;
						ProgressSpinner.remove( progressSpinnerId );
						UserAlertService.showAlert( { type: 'error', 
													  message: 'There was an issue removing items from Saved for Later. Please try again.', 
													  target: 'aboveSavedForLater',
													  alertId: 'savedForLaterError' } );
					});
	}

	function deleteItemHandler() {

		if ( lockDataUpdates ) return;
		lockDataUpdates = true;

		var wishlistItemId = $(this).closest('.savedForLaterItem').attr('data-wishlist-item-id');

		var timeoutId = setTimeout( function() {
										showDeleteItemButton( wishlistItemId, 'spinner' );
									}, itemUpdateSpinnerDelay );

		SavedForLaterService.deleteSavedForLaterItem( wishlistItemId )
			.then(	function success() {
						lockDataUpdates = false;
						clearTimeout( timeoutId );
					},
					function error() {
						lockDataUpdates = false;
						clearTimeout( timeoutId );
						showDeleteItemButton( wishlistItemId );
						UserAlertService.showAlert( { type: 'error', 
													  message: 'There was an issue removing this item from Saved for Later. Please try again.', 
													  target: 'aboveSavedForLater',
													  alertId: 'savedForLaterError' } );
					});
	}

	function changeResultsPageHandler( event ) {

		event.preventDefault();

		if ( lockDataUpdates ) return;
		lockDataUpdates = true;

		SavedForLaterService.currentResultsPage = parseInt( $(this).attr('data-target-results-page') );

		var progressSpinnerTargetElement = $(this).closest('.savedForLaterItems');
		var progressSpinnerTopRadiusTargetElement = progressSpinnerTargetElement.find('.savedForLaterItemsHeader');
		var progressSpinnerBottomRadiusTargetElement = progressSpinnerTargetElement.find('.ag-cart');

		var progressSpinnerId = ProgressSpinner.add( progressSpinnerTargetElement, progressSpinnerTopRadiusTargetElement, progressSpinnerBottomRadiusTargetElement );
	
		SavedForLaterService.getSavedForLater()
			.then(	function success() {
						lockDataUpdates = false;
						ProgressSpinner.remove( progressSpinnerId );
					},
					function error() {
						lockDataUpdates = false;
						ProgressSpinner.remove( progressSpinnerId );
					});
	}



	function showSavedForLater() {

		if ( SavedForLaterService.savedForLater.itemSortOrder.length === 0 ) {

			rootElement.hide();
			rootElement.find('.savedForLaterItem').remove();
			rootElement.find('.savedForLaterPagination li').remove();

		} else {

			var newSavedForLaterItems = $();
			var newPagination = $();

			/* STEP 1 - Build our line items markup using our template. */

			for ( var i = 0; i < SavedForLaterService.savedForLater.itemSortOrder.length; i++ ) {

				var wishlistItemId = SavedForLaterService.savedForLater.itemSortOrder[i];
				var savedForLaterItem = SavedForLaterService.savedForLater.items['id_' + wishlistItemId];

				var newItem = rootElement.find('.savedForLaterItemTemplate').clone();

				newItem.removeClass('savedForLaterItemTemplate');
				newItem.removeAttr('style');
				newItem.addClass('savedForLaterItem');
				newItem.attr( 'data-wishlist-item-id', wishlistItemId );

				newItem.find('.itemImage a').attr( 'href', savedForLaterItem.url );
				newItem.find('.itemImage img').attr( 'src', savedForLaterItem.thumbnail );
				newItem.find('.itemDescription').attr( 'href', savedForLaterItem.url );
				newItem.find('.itemDescription').html( savedForLaterItem.description );
				newItem.find('.itemNumberUom').html( '#' + savedForLaterItem.itemNumber.trim() + ' - ' + savedForLaterItem.uom );
				newItem.find('.itemPriceDisplay').html( savedForLaterItem.priceDisplayHtml );
				newItem.find('.itemTotal').html( UtilityService.formatCurrency(savedForLaterItem.total) );

				newSavedForLaterItems = newSavedForLaterItems.add( newItem );
			}

			/* STEP 2 - Build our pagination controls (if necessary). */
			
			if ( SavedForLaterService.savedForLater.numberOfPages > 1 ) {

				var firstPageButton;
				var pageButton;
				var lastPageButton;

				/* Build the left arrow "go to first page" button. */

				if ( SavedForLaterService.currentResultsPage === 1 ) {
					var firstPageButton = $('<li class="disabled"><span><i class="icon-left-open"></i></span></li>');
				} else {
					var firstPageButton = $('<li><a href=""><span><i class="icon-left-open"></i></span></a></li>');
					firstPageButton.find('a').attr( 'data-target-results-page', 1 );
				}

				newPagination = newPagination.add( firstPageButton );

				/* Build the buttons used to select specific pages in the set by page number. */

				var firstEllipsisAdded = false;
				var lastEllipsisAdded = false;

				for ( var i = 1; i <= SavedForLaterService.savedForLater.numberOfPages; i++ ) {

					if ( i === SavedForLaterService.currentResultsPage) {
						pageButton = $('<li class="active"><span>' + i + '</span></li>');
					} else if ( i === 1
								|| i === SavedForLaterService.savedForLater.numberOfPages
								|| ( i < SavedForLaterService.currentResultsPage && i >= SavedForLaterService.currentResultsPage - SavedForLaterService.savedForLater.pagesPerSide )
								|| ( i > SavedForLaterService.currentResultsPage && i <= SavedForLaterService.currentResultsPage + SavedForLaterService.savedForLater.pagesPerSide )  ) {
						pageButton = $('<li><a href="">' + i + '</a></li>');
						pageButton.find('a').attr( 'data-target-results-page', i );
					} else if ( firstEllipsisAdded === false
								&& i < SavedForLaterService.currentResultsPage - SavedForLaterService.savedForLater.pagesPerSide ) {
						pageButton = $('<li><span>&hellip;</span></li>');
						firstEllipsisAdded = true;
					} else if ( lastEllipsisAdded === false
								&& i < SavedForLaterService.savedForLater.numberOfPages
								&& i > SavedForLaterService.currentResultsPage + SavedForLaterService.savedForLater.pagesPerSide ) {
						pageButton = $('<li><span>&hellip;</span></li>');
						lastEllipsisAdded = true;
					}

					newPagination = newPagination.add( pageButton );
				}

				/* Build the right arrow "go to last page" button. */

				if ( SavedForLaterService.currentResultsPage === SavedForLaterService.savedForLater.numberOfPages ) {
					var lastPageButton = $('<li class="disabled"><span><i class="icon-right-open"></i></span></li>');
				} else {
					var lastPageButton = $('<li><a href=""><i class="icon-right-open"></i></a></li>');
					lastPageButton.find('a').attr( 'data-target-results-page', SavedForLaterService.savedForLater.numberOfPages );
				}

				newPagination = newPagination.add( lastPageButton );
			}

			/* STEP 3 - Refresh the DOM with our new markup. */

			rootElement.hide();

			rootElement.find('.savedForLaterItem').remove();
			rootElement.find('.savedForLaterItemTemplate').after( newSavedForLaterItems );

			rootElement.find('.savedForLaterPagination li').remove();

			if ( $(newPagination).length ) {
				rootElement.find('.savedForLaterPagination ul').append( newPagination );
				rootElement.find('.savedForLaterPagination').show();
			} else {
				rootElement.find('.savedForLaterPagination').hide();
			}

			rootElement.show();

		}
	}

	function showAllItemsMovedToCartMessage( displayState ) {

		if ( displayState === 'hide' ) {
			rootElement.find('.allItemsMovedToCartMessage').css({'display':'none'});
			rootElement.find('.savedForLaterItem').css({'display':''});
		} else {
			rootElement.find('.savedForLaterItem').css({'display':'none'});
			rootElement.find('.allItemsMovedToCartMessage').css({'display':''});
		}
	}

	function showItemMovedToCartMessage( wishlistItemId, displayState ) {

		var targetItem = rootElement.find( '[data-wishlist-item-id=' + wishlistItemId + ']');

		if ( displayState === 'hide' ) {
			targetItem.children('.itemMovedToCartMessage').css({'display':'none'});
			targetItem.children().not('.itemMovedToCartMessage').css({'display':''});
		} else {
			targetItem.children().not('.itemMovedToCartMessage').css({'display':'none'});
			targetItem.children('.itemMovedToCartMessage').css({'display':''});
		}
	}

	function showMoveItemToCartButton( wishlistItemId, iconToShow ) {

		var targetItem = rootElement.find( '[data-wishlist-item-id=' + wishlistItemId + ']').find('.moveItemToCartButton');

		if ( iconToShow === 'spinner' ) {
			targetItem.find('.moveItemToCartButtonIconShoppingCart').css({'display':'none'});
			targetItem.find('.moveItemToCartButtonIconSpinner').css({'display':''});
		} else {
			targetItem.find('.moveItemToCartButtonIconShoppingCart').css({'display':''});
			targetItem.find('.moveItemToCartButtonIconSpinner').css({'display':'none'});
		}
	}

	function showDeleteItemButton( wishlistItemId, iconToShow ) {

		var targetItem = rootElement.find( '[data-wishlist-item-id=' + wishlistItemId + ']').find('.itemDelete');

		if ( iconToShow === 'spinner' ) {
			targetItem.find('.deleteItemButton').css({'display':'none'});
			targetItem.find('.deleteItemButtonIconSpinner').css({'display':''});
		} else {
			targetItem.find('.deleteItemButton').css({'display':''});
			targetItem.find('.deleteItemButtonIconSpinner').css({'display':'none'});
		}
	}



}( jQuery, 
   wss.shoppingCart.savedForLaterService, 
   wss.shoppingCart.customerService, 
   wss.shoppingCart.utilityService, 
   wss.shoppingCart.userAlertService, 
   wss.shoppingCart.cartService,
   wss.shoppingCart.progressSpinnerComponent ));
