


wss.shoppingCart.utilityService = ( function( $ ) {

	'use strict';

	var service = {};

	// Taken from https://gist.github.com/nicbell/6081098
	service.objectsAreEqual = function( object1, object2 ) {

		//Loop through properties in object 1
		for ( var p in object1 ) {

			//Check property exists on both objects
			if ( object1.hasOwnProperty(p) !== object2.hasOwnProperty(p) ) return false;
	 
			switch ( typeof (object1[p]) ) {
				//Deep compare objects
				case 'object':
					if ( !service.objectsAreEqual( object1[p], object2[p] ) ) return false;
					break;
				//Compare function code
				case 'function':
					if ( typeof (object2[p]) == 'undefined' || ( p != 'compare' && object1[p].toString() != object2[p].toString() ) ) return false;
					break;
				//Compare values
				default:
					if ( object1[p] != object2[p] ) return false;
			}
		}
	 
		//Check object 2 for any extra properties
		for ( var p in object2 ) {
			if ( typeof (object1[p]) == 'undefined' ) return false;
		}

		return true;
	}

	// Adapted from formatCurrency() in jquery.currency.js
	service.formatCurrency = function( value ) {

		var num, sign, cents;
		num = value.toString().replace(/[$,]/g,'');
		if ( isNaN(num) ) num = "0";
		sign = (num == (num = Math.abs(num)));
		num = Math.floor(num * 100 + 0.50000000001);
		cents = num % 100;
		num = Math.floor(num / 100).toString();
		if (cents < 10) cents = "0" + cents;
		for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++)
			num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
		return (sign ? '' : '-') + '$' + num + '.' + cents;
	}

	// Taken from http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
	service.isElementInViewport = function ( element ) {

		// special bonus for those using jQuery
		if ( typeof jQuery === "function" && element instanceof jQuery ) {
			element = element[0];
		}

		var rect = element.getBoundingClientRect();

		return ( rect.top >= 0 
				 && rect.left >= 0 
				 && rect.bottom <= $(window).height() 
				 && rect.right <= $(window).width() );
	}

	return service;

}( jQuery ));
