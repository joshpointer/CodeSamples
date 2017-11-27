


wss.shoppingCart.userAlertController = ( function( $, UserAlertService, UtilityService ) {



	'use strict';



	if ( !wss.shoppingCart.isEnabled ) return;



	var rootElement = $('[data-wss-controller=userAlertController]');
	var activeTimeoutIds = {};



	$(document).ready( initializeUserAlerts );

	function initializeUserAlerts() {
		
		if ( typeof wss.shoppingCart.userAlertsPreloadData !== 'undefined' ) {
			for ( var i = 0; i < wss.shoppingCart.userAlertsPreloadData.length; i++ ) {
				UserAlertService.showAlert( wss.shoppingCart.userAlertsPreloadData[i] );
			}
		}
	}



	$( UserAlertService ).on( 'newAlertEvent', newAlertHandler );
	$( UserAlertService ).on( 'clearAlertsEvent', clearAlertsHandler );

	function newAlertHandler( event, alertId, type, message, target, scrollToTarget, timeToLive ) {

		var targetElement;
		var alertHtml = '<div class="alert alert-' + type + ' alertId_' + alertId + '">' + message + '</div>';

		if ( target ) {
			targetElement = rootElement.filter('[data-user-alert-target=' + target + ']');
		} else {
			targetElement = rootElement;
		}

		/* If an alert with this alertId has previously been triggered, remove it now as we don't want to show multiple instances of the same alert. */
		targetElement.find('.alertId_' + alertId).remove();

		/* If we just removed an alert, we need to also clear any timeout we set in support of its timeToLive setting. If we don't clear that timeout, the alert we're about to show (which has the same alertId, remember) will be prematurely cleared when the just-removed alert's timeToLive expires. */
		if ( typeof activeTimeoutIds[alertId] !== 'undefined' ) {
			clearTimeout( activeTimeoutIds[alertId] );
			delete activeTimeoutIds[alertId];
		}

		targetElement.append( alertHtml );

		if ( scrollToTarget && !UtilityService.isElementInViewport( targetElement ) ) {
			$('html,body').animate( { scrollTop: targetElement.offset().top - 15 }, 250 );
		}

		if ( timeToLive !== -1 ) {
			var timeoutId = setTimeout(	function() {
											targetElement.find('.alertId_' + alertId).slideUp();
											delete activeTimeoutIds[alertId];
										}, timeToLive );
			/* Remember this timeout id as we'll need to clear it if another alert with the same alertId comes in prior to the expiration of this alert's timeToLive. */
			activeTimeoutIds[alertId] = timeoutId;
		}
	}

	function clearAlertsHandler( event, alertId ) {

		if ( typeof alertId === 'undefined' ) {
			rootElement.find('.alert').remove();
		} else {
			rootElement.find('.alertId_' + alertId).remove();
			delete activeTimeoutIds[alertId];
		}
	}



}( jQuery, wss.shoppingCart.userAlertService, wss.shoppingCart.utilityService ));
