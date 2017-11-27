import React from 'react';
import Alert from './Alert';

export default class LeadCollector extends React.Component {

	constructor( props ) {
		super( props );
		this.state = { campaignId: 1, email: '' };
		this.handleChange = this.handleChange.bind(this);
		this.handleKeyUp = this.handleKeyUp.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleChange( event ) {
		this.setState( { email: event.target.value } );
	}

	handleKeyUp( event ) {
		if ( event.keyCode === 13 ) {
			this.handleSubmit();
		}
	}

	handleSubmit() {
		this.props.actions.saveLead( this.state.campaignId, this.state.email );
	}

	render() {

		return (

			<div className="lead-collector">

				<Alert type="success" show={ this.props.store.status === 'COLLECTED' }>
					<strong>Awesome!</strong> We'll let you know when it's ready!
				</Alert>

				<Alert type="danger" show={ this.props.store.status === 'ERROR' }>
					<strong>Oops!</strong> Something went wrong. Try again!
				</Alert>

				<Alert type="danger" show={ this.props.store.status === 'VALIDATION_ERROR' }>
					That's not a valid email address. Try again!
				</Alert>

				{ this.props.store.status !== 'COLLECTED' && 
					<div>
						<input type="email" 
							   className="form-control" 
							   placeholder="Email Address"
							   value={ this.state.email }
							   onChange={ this.handleChange }
							   onKeyUp={ this.handleKeyUp } />
						<a className="btn btn-success form-control d-inline-block" 
						   onClick={ this.handleSubmit }>
							Help me find my match!
						</a>
					</div>
				}

			</div>

		);
	}
}
