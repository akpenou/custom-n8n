import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { Midjourney as MidjourneyClient } from 'midjourney';
import { pick } from 'lodash';

const inputs: { [key: string]: INodeProperties } = {
	action: {
		displayName: 'Action',
		name: 'action',
		type: 'options',
		noDataExpression: true,
		default: 'imagine',
		options: [
			{
				name: 'Custom',
				value: 'custom',
				description: 'Use custom values for call',
				action: 'Use custom values for call',
			},
			{
				name: 'Describe',
				value: 'describe',
				description: 'Describe the image',
				action: 'Describe the image',
			},
			{
				name: 'Imagine',
				value: 'imagine',
				description: 'Generate a grid with 4 images',
				action: 'Generate a grid with 4 images',
			},
			{
				name: 'Upscale',
				value: 'upscale',
				description: 'Upscale the selected image',
				action: 'Upscale the selected image',
			},
			{
				name: 'Variation',
				value: 'variation',
				description: 'Create variation grid with 4 images',
				action: 'Create variation grid with 4 images',
			},
			{
				name: 'Zoom Out',
				value: 'zoomout',
				description: 'Zoom out selected image',
				action: 'Zoom out selected image',
			},
		],
	},
	prompt: {
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['imagine', 'variation'],
			},
		},
		placeholder: 'prompt',
		description: 'The prompt to imagine',
		required: true,
	},
	imageURI: {
		displayName: 'Image URI',
		name: 'imageURI',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['describe'],
			},
		},
		placeholder: 'imageURI',
		required: true,
	},
	msgId: {
		displayName: 'Message ID',
		name: 'msgId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['variation', 'upscale', 'zoomout', 'custom'],
			},
		},
		placeholder: 'msgId',
		required: true,
	},
	messageHash: {
		displayName: 'Message Hash',
		name: 'messageHash',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['variation', 'upscale', 'zoomout'],
			},
		},
		placeholder: 'messageHash',
		required: true,
	},
	messageFlags: {
		displayName: 'Message Flags',
		name: 'messageFlags',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				action: ['variation', 'upscale', 'zoomout', 'custom'],
			},
		},
		placeholder: 'messageFlags',
		required: true,
	},
	index: {
		displayName: 'Index',
		name: 'index',
		type: 'number',
		default: 1,
		displayOptions: {
			show: {
				action: ['variation', 'upscale'],
			},
		},
		placeholder: 'index',
		required: true,
	},
	custom: {
		displayName: 'Custom ID',
		name: 'customId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['custom'],
			},
		},
		placeholder: 'custom',
		description: 'The custom',
		required: true,
	},
	zoomLevel: {
		displayName: 'Zoom Level',
		name: 'zoomLevel',
		type: 'options',
		default: 'high',
		displayOptions: {
			show: {
				action: ['zoomout'],
			},
		},
		placeholder: 'zoomLevel',
		required: true,
		options: [
			{
				name: 'High',
				value: 'high',
			},
			{
				name: 'Low',
				value: 'low',
			},
			{
				name: '2x',
				value: '2x',
			},
			{
				name: '1.5x',
				value: '1.5x',
			},
		],
	},
};

export class Midjourney implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Midjourney',
		name: 'midjourney',
		group: ['transform'],
		icon: 'file:midjourney.svg',
		version: 1,
		description: 'AI to generate images',
		defaults: {
			name: 'Midjourney',
		},
		subtitle: '={{$parameter["action"]}}',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [NodeConnectionType.Main],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'midjourneyApi',
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

		const credentials = await this.getCredentials('midjourneyApi');
		const client = new MidjourneyClient({
			ServerId: <string>credentials.serverId,
			ChannelId: <string>credentials.channelId,
			SalaiToken: <string>credentials.salaiToken,
			Debug: true,
			Ws: true, //enable ws is required for remix mode (and custom zoom)
		});
		await client.init();

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];

				const action = this.getNodeParameter('action', itemIndex) as string;
				switch (action) {
					case 'imagine': {
						const prompt = this.getNodeParameter('prompt', itemIndex) as string;
						const msg = await client.Imagine(prompt);
						item.json = pick(msg, ['id', 'hash', 'content', 'uri', 'flags', 'options']);
						continue;
					}
					case 'describe': {
						const imageURI = this.getNodeParameter('imageURI', itemIndex) as string;
						const msg = await client.Describe(imageURI);
						item.json = pick(msg, ['descriptions', 'uri']);
						continue;
					}
					case 'custom': {
						const msgId = this.getNodeParameter('msgId', itemIndex) as string;
						const flags = this.getNodeParameter('messageFlags', itemIndex) as number;
						const customId = this.getNodeParameter('customId', itemIndex) as string;
						const msg = await client.Custom({
							msgId,
							flags,
							customId,
						});
						item.json = pick(msg, ['id', 'hash', 'content', 'uri', 'flags', 'options']);
						continue;
					}
					case 'upscale': {
						const index = this.getNodeParameter('index', itemIndex) as 1 | 2 | 3 | 4;
						const msgId = this.getNodeParameter('msgId', itemIndex) as string;
						const messageHash = this.getNodeParameter('messageHash', itemIndex) as string;
						const messageFlags = this.getNodeParameter('messageFlags', itemIndex) as number;
						const msg = await client.Upscale({
							index,
							msgId,
							hash: messageHash,
							flags: messageFlags,
						});
						item.json = pick(msg, ['id', 'hash', 'content', 'uri', 'flags', 'options']);
						continue;
					}
					case 'variation': {
						const index = this.getNodeParameter('index', itemIndex) as 1 | 2 | 3 | 4;
						const msgId = this.getNodeParameter('msgId', itemIndex) as string;
						const messageHash = this.getNodeParameter('messageHash', itemIndex) as string;
						const messageFlags = this.getNodeParameter('messageFlags', itemIndex) as number;
						const prompt = this.getNodeParameter('prompt', itemIndex) as string;
						const msg = await client.Variation({
							index,
							msgId,
							hash: messageHash,
							flags: messageFlags,
							content: prompt,
						});
						item.json = pick(msg, ['id', 'hash', 'content', 'uri', 'flags', 'options']);
						continue;
					}
					case 'zoomout': {
						const zoomLevel = this.getNodeParameter('zoomLevel', itemIndex) as
							| 'high'
							| 'low'
							| '2x'
							| '1.5x';
						const msgId = this.getNodeParameter('msgId', itemIndex) as string;
						const messageHash = this.getNodeParameter('messageHash', itemIndex) as string;
						const messageFlags = this.getNodeParameter('messageFlags', itemIndex) as number;
						const msg = await client.ZoomOut({
							level: zoomLevel,
							msgId,
							hash: messageHash,
							flags: messageFlags,
						});
						item.json = pick(msg, ['id', 'hash', 'content', 'uri', 'flags', 'options']);
						continue;
					}
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
