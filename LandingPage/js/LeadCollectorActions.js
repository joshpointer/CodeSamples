import axios from 'axios';
import Dispatcher from './dispatcher';
import ServiceDirectory from '../../serviceDirectory';

export default {

	saveLead: function( campaignId, email ) {

		if ( !validateEmail( email ) ) {
			Dispatcher.dispatch( { type: 'UPDATE_STATUS', status: 'VALIDATION_ERROR' } );
			return; 
		}

		window.gtag( 'event', 'new_lead', { 'event_category': 'engagement', 'campaign_id': 1 } );

		axios({ 
			method: 'post',
			url: ServiceDirectory.getUrl( 'service-leads' ),
			data: { campaignId, email },
			responseType: 'json'

		})
		.then( () => Dispatcher.dispatch( { type: 'UPDATE_STATUS', status: 'COLLECTED' } ) )
		.catch(	() => Dispatcher.dispatch( { type: 'UPDATE_STATUS', status: 'ERROR' } ) );

	}
}

function validateEmail( email ) {
	return /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test( email );
}
