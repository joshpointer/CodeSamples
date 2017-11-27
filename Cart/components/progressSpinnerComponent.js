


wss.shoppingCart.progressSpinnerComponent = ( function( $ ) {

	'use strict';

	var component = {};

	var spinnerTemplate = 	'<div>' +
						  		'<div style="position:relative;top:50%;transform:translateY(-50%)">' +
						  			'<i class="icon-spinner"></i>' +
						  		'</div>' +
						  	'</div>'

	component.add = function( targetElement, topRadiusTargetElement, bottomRadiusTargetElement ) {

		/* Create a random six digit id for managing the life-cycle of the spinner. */
		var spinnerId = parseInt( Math.floor( Math.random() * 1000000 ) );

		var topLeftRadius = targetElement.css('border-top-left-radius');
		var topRightRadius = targetElement.css('border-top-right-radius');
		var bottomLeftRadius = targetElement.css('border-bottom-left-radius');
		var bottomRightRadius = targetElement.css('border-bottom-right-radius');

		if ( topRadiusTargetElement ) {
			topLeftRadius = topRadiusTargetElement.css('border-top-left-radius') || topLeftRadius;
			topRightRadius = topRadiusTargetElement.css('border-top-right-radius') || topRightRadius;
		}

		if ( bottomRadiusTargetElement ) {
			bottomLeftRadius = topRadiusTargetElement.css('border-top-left-radius') || bottomLeftRadius;
			bottomRightRadius = topRadiusTargetElement.css('border-top-right-radius') || bottomRightRadius;
		}

		var spinnerCss = { 'position': 'absolute',
						   'background-color': 'rgba(255,255,255,0.5)',
						   'text-align': 'center',
						   'z-index': 10000,
						   'top': 0,
						   'left': 0,
						   'height': '100%',
						   'width': '100%',
						   'border-top-left-radius': topLeftRadius,
						   'border-top-right-radius': topRightRadius,
						   'border-bottom-left-radius': bottomLeftRadius,
						   'border-bottom-right-radius': bottomRightRadius };

		var spinner = $( spinnerTemplate );
		spinner.css( spinnerCss );
		spinner.addClass( 'spinnerId_' + spinnerId );

		targetElement.css( {'position':'relative'} );
		targetElement.prepend( spinner );

		return spinnerId;
	}

	component.remove = function( spinnerId ) {
		$( document ).find( '.spinnerId_' + spinnerId ).remove();
	}

	return component;

}( jQuery ));
