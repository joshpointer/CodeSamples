import React from 'react';
import LeadCollector from './LeadCollector';
import LeadCollectorActions from './LeadCollectorActions';
import LeadCollectorStore from './LeadCollectorStore';

export default class LeadCollectorController extends React.Component {

	constructor() {
		super();
		this.state = {
			store: LeadCollectorStore.getStore(),
			actions: {
				saveLead: LeadCollectorActions.saveLead
			}
		};
	}

	componentDidMount() {
		LeadCollectorStore.on( 'change', () => {
			this.setState( { store: LeadCollectorStore.getStore() } );
		});
	}

	render() {
		return (
			<LeadCollector store={this.state.store} actions={this.state.actions} />
		);
	}
}
