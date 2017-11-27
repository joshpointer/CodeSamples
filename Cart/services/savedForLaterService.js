


wss.shoppingCart.savedForLaterService = ( function( $ ) {

	'use strict';

	var service = {};

	service.savedForLater = {};
	service.currentResultsPage = 1;

	service.getSavedForLater = function() {

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  data: { 'resultsPage': service.currentResultsPage },
				  dataType: 'json',
				  type: 'GET',
				  url: '/shoppingcart:cart/getsavedforlater/' } )
		.then(	function success( response ) {
					service.savedForLater = $.extend( true, {}, response );
					$( service ).trigger( 'savedForLaterUpdate' );
					promiseObj.resolve();
				},
				function error() {
					console.log('ERROR: savedForLaterService.getSavedForLater()');
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.deleteAllSavedForLaterItems = function() {

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/deleteallsavedforlateritems/' } )
		.then(	function success( response ) {
					service.savedForLater = $.extend( true, {}, response );
					service.currentResultsPage = 1;
					$( service ).trigger( 'savedForLaterUpdate' );
					promiseObj.resolve();
				},
				function error() {
					console.log('ERROR: savedForLaterService.deleteAllSavedForLaterItems()');
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.deleteSavedForLaterItem = function( wishlistItemId ) {

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  data: { 'wishlistItemId': wishlistItemId, 'resultsPage': service.currentResultsPage },
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/deletesavedforlateritem/' } )
		.then(	function success( response ) {
					service.savedForLater = $.extend( true, {}, response );
					$( service ).trigger( 'savedForLaterUpdate' );
					promiseObj.resolve();
				},
				function error() {
					console.log('ERROR: savedForLaterService.deleteSavedForLaterItem()');
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	service.moveCartItemToSavedForLater = function( itemNumber, quantity ) {

		var promiseObj = $.Deferred();

		$.ajax( { cache: false,
				  data: { 'itemNumber': itemNumber, 
				  		  'quantity': quantity,
				  		  'resultsPage': service.currentResultsPage  },
				  dataType: 'json',
				  type: 'POST',
				  url: '/shoppingcart:cart/movecartitemtosavedforlater/' } )
		.then(	function success( response ) {
					if ( response === 'MAXSIZE_ERROR' ) {
						promiseObj.resolve( response );
					} else {
						service.savedForLater = $.extend( true, {}, response );
						$( service ).trigger( 'savedForLaterUpdate' );
						promiseObj.resolve();
					}
				},
				function error() {
					console.log('ERROR: savedForLaterService.moveCartItemToSavedForLater()');
					promiseObj.reject();
				} );

		return promiseObj.promise();
	}

	return service;

}( jQuery ));
