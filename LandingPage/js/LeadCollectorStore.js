import { EventEmitter } from 'events';
import Dispatcher from './dispatcher';

class LeadCollectorStore extends EventEmitter {

	constructor() {
		super();
		this.store = { status: 'UNCOLLECTED' };
	}

	getStore() {
		return this.store;
	}

	actionHandler( action ) {
		switch( action.type ) {
			case 'UPDATE_STATUS': {
				this.store.status = action.status;
				this.emit('change');
				break;
			}
		}	
	}
}

const leadCollectorStore = new LeadCollectorStore;

Dispatcher.register( leadCollectorStore.actionHandler.bind(leadCollectorStore) );

export default leadCollectorStore;
