


wss.shoppingCart.userAlertService = ( function( $ ) {

	'use strict';

	var service = {};

	service.showAlert = function( options ) {

		options = options || {};

		/* The alertId is used to manage the life-cycle of an alert. Mostly to prevent the same alert from being displayed multiple times when the action gets fast and furious (repeating the same action multiple times in rapid succession, for example). If a specific alertId isn't passed in, we just create a random six digit id. */
		options.alertId = options.alertId || parseInt( Math.floor( Math.random() * 1000000 ) );

		/* Valid alert types are 'info', 'success', 'warning' and 'error'. */
		if ( options.type !== 'info' 
			 && options.type !== 'success' 
			 && options.type !== 'warning' 
			 && options.type !== 'error' ) {
			options.type = 'info';
		}

		options.message = options.message || '';

		options.target = options.target || '';

		if ( typeof options.scrollToTarget !== 'boolean' ) {
			options.scrollToTarget = true;
		}

		/* A timeTolive value of -1 creates an alert message that doesn't go away. Any other value is the number of milliseconds before the alert goes away. */
		if ( typeof options.timeToLive !== 'number' ) {
			options.timeToLive = 5000;
		}

		$( service ).trigger( 'newAlertEvent', [ options.alertId, options.type, options.message, options.target, options.scrollToTarget, options.timeToLive ] );
	}

	service.clearAlerts = function( alertId ) {

		$( service ).trigger( 'clearAlertsEvent', alertId );
	}

	return service;

}( jQuery ));
