import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

import { OnOff as OnOffLib } from './libs/onoff';
import _ from 'lodash';

const inputs: { [key: string]: INodeProperties } = {
	action: {
		displayName: 'Action',
		name: 'action',
		type: 'options',
		noDataExpression: true,
		default: 'fetchCalls',
		options: [
			{
				name: 'Download Call Recording',
				value: 'downloadMp3',
				description: 'Download call recording as MP3',
				action: 'Download call recording as MP3',
				// args: callId
			},
			{
				name: 'Fetch Calls',
				value: 'fetchCalls',
				description: 'Retrieve call records',
				action: 'Retrieve call records',
				// args: callId?, phoneNumber?, dateFrom?, dateTo?, callerNumber?
			},
			{
				name: 'Fetch Contacts',
				value: 'fetchContacts',
				description: 'Retrieve contact list',
				action: 'Retrieve contact list',
				// args: name?, phoneNumber?, email?
			},
			{
				name: 'Send SMS',
				value: 'sendSMS',
				description: 'Send a sms',
				action: 'Send a sms',
				// args: phoneNumber, content, callNumber?
			},
			{
				name: 'Upsert Contact',
				value: 'upsertContact',
				description: 'Create or update a contact',
				action: 'Create or update a contact',
				// args: idPhone, data
			},
		],
	},

	phoneNumber: {
		displayName: 'Phone Number',
		name: 'phoneNumber',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['sendSMS'],
			},
		},
		placeholder: 'Phone Number',
		description: 'The phone number to send the SMS to',
		required: true,
	},
	content: {
		displayName: 'Content',
		name: 'content',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['sendSMS'],
			},
		},
		placeholder: 'Content',
		description: 'The content of the SMS',
		required: true,
	},
	callId: {
		displayName: 'Call ID',
		name: 'callId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['downloadMp3'],
			},
		},
		placeholder: 'Call ID',
		description: 'The ID of the call to download or fetch',
		required: true,
	},
	firstname: {
		displayName: 'Firstname',
		name: 'firstname',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['upsertContact'],
			},
		},
		placeholder: 'Firstname',
		description: 'The firstname of the contact',
		required: true,
	},
	lastname: {
		displayName: 'Lastname',
		name: 'lastname',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['upsertContact'],
			},
		},
		placeholder: 'Lastname',
		description: 'The lastname of the contact',
		required: true,
	},
	email: {
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['upsertContact'],
			},
		},
		placeholder: 'Email',
		description: 'The email of the contact',
	},
	optionsCalls: {
		displayName: 'Filter For Calls',
		name: 'optionsCalls',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				action: ['fetchCalls'],
			},
		},
		options: [
			{
				displayName: 'Caller Number',
				name: 'callerNumber',
				type: 'string',
				default: '',
				description: 'The number of the caller +336',
			},
			{
				displayName: 'Callee Number',
				name: 'calleeNumber',
				type: 'string',
				default: '',
				description: 'The number of the callee +336',
			},
			{
				displayName: 'Date From',
				name: 'dateFrom',
				type: 'dateTime',
				default: '',
				description: 'Filter calls from this date',
			},
			{
				displayName: 'Date To',
				name: 'dateTo',
				type: 'dateTime',
				default: '',
				description: 'Filter calls to this date',
			},
		],
	},
};

export class Onoff implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Onoff',
		name: 'onoff',
		group: ['transform'],
		icon: 'file:onoff.svg',
		version: 1,
		description: 'Onoff API',
		defaults: {
			name: 'Onoff',
		},
		subtitle: '={{$parameter["action"]}}',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [NodeConnectionType.Main],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'onoffApi',
				required: true,
			},
		],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			...Object.values(inputs),
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;

		const credentials = await this.getCredentials('onoffApi');

		const accessToken = credentials.accessToken as string;
		const onoff = new OnOffLib(accessToken);

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];
				const action = this.getNodeParameter(inputs.action.name, itemIndex, '') as string;

				switch (action) {
					case 'fetchCalls':
						const options = this.getNodeParameter(inputs.optionsCalls.name, itemIndex, {}) as any;
						const callerNumber = options.callerNumber as string;
						const calleeNumber = options.calleeNumber as string;
						const fromDate = options.dateFrom as string;
						const toDate = options.dateTo as string;
						let calls = await onoff.getCalls({
							fromDate: fromDate || undefined,
							toDate: toDate || undefined,
						});

						if (calleeNumber) {
							calls = calls.filter((call) => call.call.callee.number === calleeNumber);
						}

						if (callerNumber) {
							calls = calls.filter((call) => call.call.caller.number === callerNumber);
						}

						if (fromDate) {
							calls = calls.filter((call) => call.call.startedAt >= fromDate);
						}

						if (toDate) {
							calls = calls.filter((call) => call.call.endedAt <= toDate);
						}

						item.json['calls'] = calls;
						break;
					case 'fetchContacts':
						const contacts = await onoff.getContacts();
						item.json['contacts'] = contacts;
						break;
					case 'downloadMp3':
						const callId = this.getNodeParameter(inputs.callId.name, itemIndex, '') as string;
						const mp3 = await onoff.downloadCall(callId);
						item.json['filename'] = mp3.name;
						if (!item.binary) item.binary = {};
						item.binary.mp3 = await this.helpers.prepareBinaryData(
							Buffer.from(await mp3.arrayBuffer()),
							'call.mp3',
							'audio/mpeg',
						);
						break;
					case 'sendSMS':
						{
							const phoneNumber = this.getNodeParameter(
								inputs.phoneNumber.name,
								itemIndex,
								'',
							) as string;
							const content = this.getNodeParameter(inputs.content.name, itemIndex, '') as string;
							await onoff.sendMessage(phoneNumber, content);
						}
						break;
					case 'upsertContact':
						const firstname = this.getNodeParameter(inputs.firstname.name, itemIndex, '') as string;
						const lastname = this.getNodeParameter(inputs.lastname.name, itemIndex, '') as string;
						const email = this.getNodeParameter(inputs.email.name, itemIndex, '') as string;
						const phoneNumber = this.getNodeParameter(
							inputs.phoneNumber.name,
							itemIndex,
							'',
						) as string;
						await onoff.upsertContact(phoneNumber, {
							firstName: firstname,
							lastName: lastname,
							emails: [
								{
									type: 'WORK',
									email,
								},
							],
							phones: [
								{
									type: 'Mobile',
									number: `+${phoneNumber}`,
									favorite: true,
									normalNumber: phoneNumber,
								},
							],
						});
						break;
				}
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(items);
	}
}
