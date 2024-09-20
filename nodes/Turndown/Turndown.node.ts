import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { deepCopy, NodeConnectionType } from 'n8n-workflow';

import TurndownService from 'turndown';

import set from 'lodash/set';

export class Turndown implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Turndown',
		name: 'turndown',
		icon: 'file:turndown.svg',
		group: ['output'],
		version: 1,
		subtitle: 'HTML to Markdown',
		description: 'Convert HTML in Markdown',
		defaults: {
			name: 'Turndown',
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [NodeConnectionType.Main],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
		credentials: [],
		properties: [
			{
				displayName: 'HTML',
				name: 'html',
				type: 'string',
				default: '',
				required: true,
				description: 'The HTML to be converted to markdown',
			},
			{
				displayName: 'Destination Key',
				name: 'destinationKey',
				type: 'string',
				default: 'data',
				required: true,
				placeholder: 'data',
				description:
					'The field to put the output in. Specify nested fields using dots, e.g."level1.level2.newKey".',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		const turndownService = new TurndownService({
			headingStyle: 'atx',
			bulletListMarker: '-',
		});

		const { length } = items;
		for (let i = 0; i < length; i++) {
			try {
				const destinationKey = this.getNodeParameter('destinationKey', i) as string;

				const html = this.getNodeParameter('html', i) as string;

				const markdown = turndownService.turndown(html);

				const newItem = deepCopy(items[i].json);
				set(newItem, destinationKey, markdown);
				returnData.push(newItem);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: (error as JsonObject).message });
					continue;
				}
				throw error;
			}
		}
		return [this.helpers.returnJsonArray(returnData)];
	}
}
