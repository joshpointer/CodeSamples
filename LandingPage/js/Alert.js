import React from 'react';

export default class Alert extends React.Component {

	constructor( props ) {
		super( props );
	}

	render() {

		if ( !this.props.show ) return null;

		return (
			<div className={ 'alert alert-' + this.props.type }>
				{ this.props.children }
			</div>
		);
	}
}
