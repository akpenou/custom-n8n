import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { GooogleSlidesGenerator } from './libs/md2googleslides/md2gslides-v2';
import { OAuth2Client } from 'google-auth-library';

const inputs: { [key: string]: INodeProperties } = {
	content: {
		displayName: 'Content',
		name: 'content',
		type: 'string',
		default: '',
		placeholder: 'content',
		description: 'The content to append',
		required: true,
	},
	options: {
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Options',
		default: {},
		options: [
			{
				displayName: 'Append To',
				name: 'appendTo',
				type: 'string',
				default: '',
				placeholder: 'slideId or URL',
				description: 'The ID or URL of the slide to apppend to',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the slide',
			},
			{
				displayName: 'Erase',
				name: 'erase',
				type: 'boolean',
				default: false,
				description: 'Whether erase the slide before appending',
			},
			{
				displayName: 'Copy From',
				name: 'copyFrom',
				type: 'string',
				default: '',
				description: 'The ID or URL of the slide to copy from',
			},
		],
	},
};

export class MarkdownToGoogleSlides implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Markdown To Google Slides',
		name: 'markdownToGoogleSlides',
		group: ['transform'],
		icon: 'file:md2gslide.svg',
		version: 1,
		description: 'Transform Markdown to Google Slides',
		defaults: {
			name: 'markdown to gslides',
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [NodeConnectionType.Main],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'googleSlidesOAuth2Api',
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

		const credentials = await this.getCredentials('googleSlidesOAuth2Api');
		const oauth2Client = new OAuth2Client({
			clientId: credentials.clientId as string,
			clientSecret: credentials.clientSecret as string,
		});
		oauth2Client.setCredentials(credentials.oauthTokenData as any);

		const md2googleslides = new GooogleSlidesGenerator(oauth2Client);

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];
				const content = this.getNodeParameter('content', itemIndex, '') as string;
				const title = this.getNodeParameter('options.title', itemIndex, '') as string;
				const appendTo = this.getNodeParameter('options.appendTo', itemIndex, '') as string;
				const erase = this.getNodeParameter('options.erase', itemIndex, false) as boolean;
				const copyFrom = this.getNodeParameter('options.copyFrom', itemIndex, '') as string;

				const URL = await md2googleslides.createSlide(title, content, {
					appendTo,
					erase,
					copyFrom,
				});

				item.json['url'] = URL;
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
