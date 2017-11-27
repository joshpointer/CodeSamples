'use strict';



angular.module('ReturnRoutingApp').factory('MessageService', ['wssToastr', function( wssToastr ) {

	var service = {};

	service.alert = function( message ) {
		console.log(message);
	}

	service.showStatusMessage = function( type, message ) {

		var timeOut = 2500;

		// Valid toastr types are 'success', 'info', 'warning' and 'error'

		if ( type === undefined ) type = 'error';
		if ( message === undefined ) message = 'OOPS! There was a problem completing your request. Please try again.';

		// Our convention is to show an 'info' level message when a network operation begins, and then a 'success' or 'error' level
		// message upon completion. Sometimes, a network operation takes a little longer to complete than we'd like, and with a 2500
		// millisecond timeout, the 'info' fades out before the follow-up message appears. This creates a little more suspense/
		// confusion for the user than we'd like. To avoid that, we jack the 'info' timeout up a bit to keep it around longer for
		// slower-running network operations. Since 'infos' should always be followed by *something*, the toastr.clear() will
		// take care of dismissing the message when the follow-up message is triggered, so there's not really any harm in setting a
		// high timeout.
		if ( type === 'info' ) timeOut = 10000;

		wssToastr.clear();
		wssToastr[type]( message, '', { 'timeOut': timeOut } );
	}

	return service;

}]);
