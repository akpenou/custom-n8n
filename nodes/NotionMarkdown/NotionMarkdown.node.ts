import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import { NotionToMarkdown } from 'notion-to-md';

const inputs: { [key: string]: INodeProperties } = {
	action: {
		displayName: 'Action',
		name: 'action',
		type: 'options',
		noDataExpression: true,
		default: 'fetchPage',
		options: [
			{
				name: 'Fetch Page',
				value: 'fetchPage',
				description: 'Retrieve a page',
				action: 'Retrieve a page',
			},
			{
				name: 'Append Page',
				value: 'appendPage',
				description: 'Append a page',
				action: 'Append a page',
			},
		],
	},
	pageId: {
		displayName: 'Page ID',
		name: 'pageId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['fetchPage', 'appendPage'],
			},
		},
		placeholder: 'pageId or URL',
		description: 'The ID or URL of the page to retrieve',
		required: true,
	},
	markdown: {
		displayName: 'Markdown',
		name: 'markdown',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				action: ['appendPage'],
			},
		},
		placeholder: 'markdown',
		description: 'The markdown to append',
		required: true,
	},
};

export class NotionMarkdown implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Notion Markdown',
		name: 'notionMarkdown',
		group: ['transform'],
		icon: 'file:md2notion.svg',
		version: 1,
		description: 'Transform Notion Pages to Markdown',
		defaults: {
			name: 'Notion Markdown',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'notionApi',
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

		const credentials = await this.getCredentials('notionApi');

		const notion = new Client({
			auth: credentials.apiKey as string,
		});

		// passing notion client to the option
		const n2m = new NotionToMarkdown({
			notionClient: notion,
			config: {
				separateChildPage: true, // default: false
			},
		});

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];

				if (this.getNodeParameter(inputs.action.name, itemIndex, '') === 'fetchPage') {
					const pageId = this.getNodeParameter(inputs.pageId.name, itemIndex, '') as string;
					const markdownNodes = await n2m.pageToMarkdown(pageId);
					const markdown = n2m.toMarkdownString(markdownNodes);

					item.json['markdown'] = markdown;
				} else if (this.getNodeParameter(inputs.action.name, itemIndex, '') === 'appendPage') {
					const pageId = this.getNodeParameter(inputs.pageId.name, itemIndex, '') as string;
					const md = this.getNodeParameter(inputs.markdown.name, itemIndex, '') as string;

					const blocks = markdownToBlocks(md);
					await notion.blocks.children.append({
						block_id: pageId,
						children: blocks as any,
					});

					item.json['pageId'] = pageId;
					item.json['markdown'] = md;
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
