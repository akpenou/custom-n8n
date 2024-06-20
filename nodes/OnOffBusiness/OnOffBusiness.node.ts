import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

const inputs: { [key: string]: INodeProperties } = {
	youtubeURL: {
		displayName: 'Youtube URL',
		name: 'youtubeURL',
		type: 'string',
		default: '',
		placeholder: 'videoID or URL',
		description: 'The ID or URL of the video to transcribe',
		required: true,
	},
};

export class OnOffBusiness implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OnOff Business',
		name: 'onoffbusiness',
		group: ['transform'],
		icon: 'file:onoffbusiness.svg',
		version: 1,
		description: 'Get activity from OnOff Business',
		defaults: {
			name: 'OnOff Business',
		},
		subtitle: 'fetch video transcript',
		inputs: ['main'],
		outputs: ['main'],
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

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];

				const youtubeURL = this.getNodeParameter(inputs.youtubeURL.name, itemIndex, '') as string;
				const videoId =
					youtubeURL.match(/v=(?<videoId>[^&]+)/)?.groups?.videoId ||
					youtubeURL.match(/youtu\.be\/(?<videoId>[a-zA-Z0-9_-]+)/)?.groups?.videoId ||
					youtubeURL;

				if (videoId) {
					const transcript = await YTClient.fetchTranscript(videoId);
					item.json['videoId'] = videoId;
					item.json['transcript'] = transcript.map((item) => item.text).join(' ');
					item.json['srt'] = convertToSrt(transcript);
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
