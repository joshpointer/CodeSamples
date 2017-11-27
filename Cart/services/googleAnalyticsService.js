


wss.shoppingCart.googleAnalyticsService = ( function( $, GoogleAnalyticsSettings ) {

	'use strict';

	var service = {};

	service.initializeGoogleAnalyticsObject = function() {

		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
	}

	service.cartItemDelete = function( cartItemData ) {

		service.initializeGoogleAnalyticsObject();

		ga('create', GoogleAnalyticsSettings.siteId, GoogleAnalyticsSettings.siteName);
		ga('require', 'ec');
		ga('ec:addProduct', { 'id': cartItemData.itemNumber,
							  'name': cartItemData.description,
							  'category': cartItemData.webCategory,
							  'brand': cartItemData.vendorName,
							  'price': cartItemData.price,
							  'qty': cartItemData.qty } );
		ga('ec:setAction', 'remove');
		ga('send', 'event', 'UX', 'click', 'remove from cart'); 
	}

	service.cartCheckoutStandard = function() {

		if ( !GoogleAnalyticsSettings.checkoutStandard ) return;

		service.initializeGoogleAnalyticsObject();

		ga( 'create', GoogleAnalyticsSettings.siteId, GoogleAnalyticsSettings.siteName );
		ga( 'send', 
			'event', 
			GoogleAnalyticsSettings.checkoutStandard.eventCategory, 
			GoogleAnalyticsSettings.checkoutStandard.eventAction, 
			GoogleAnalyticsSettings.checkoutStandard.eventLabel );
	}

	return service;

})( jQuery, wss.shoppingCart.googleAnalyticsSettings );
