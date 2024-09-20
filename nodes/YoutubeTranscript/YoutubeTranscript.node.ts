import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { YoutubeTranscript as YTClient } from 'youtube-transcript';

interface Subtitle {
	text: string;
	duration: number;
	offset: number;
}

function msToSrtTime(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	const milliseconds = ms % 1000;
	const formattedSeconds = seconds % 60;
	const formattedMinutes = minutes % 60;

	return `${hours.toString().padStart(2, '0')}:${formattedMinutes
		.toString()
		.padStart(2, '0')}:${formattedSeconds.toString().padStart(2, '0')},${milliseconds
		.toString()
		.padStart(3, '0')}`;
}

function convertToSrt(data: Subtitle[]): string {
	const arrayLength = data.length;
	return data
		.map((item, index, array) => {
			const startTime = msToSrtTime(item.offset);
			const endTime = msToSrtTime(
				index + 1 < arrayLength ? array[index + 1]?.offset : item.offset + item.duration,
			);
			return `${index + 1}\n${startTime} --> ${endTime}\n${item.text}\n`;
		})
		.join('\n');
}

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

export class YoutubeTranscript implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Youtube Transcript',
		name: 'youtubeTranscript',
		group: ['transform'],
		icon: 'file:youtubeTranscript.svg',
		version: 1,
		description: 'Get the transcript of a youtube video',
		defaults: {
			name: 'Youtube Transcript',
		},
		subtitle: 'fetch video transcript',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [NodeConnectionType.Main],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
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
