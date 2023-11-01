import { OAuth2Client } from 'google-auth-library';

import SlideGenerator from './md2googleslides/slide_generator';

import { css } from './styles/github.css';

export function loadCSS() {
	return css;
}

export function displayResults(id: string) {
	return `https://docs.google.com/presentation/d/${id}/`;
}

function getId(url?: string | null) {
	if (!url) {
		return undefined;
	}

	const regex = /docs\.google\.com\/presentation\/d\/(?<id>[\w-]+)\/?/;
	const IdMatch = url.match(regex);

	if (IdMatch) {
		const [_, id] = IdMatch;
		return id;
	}

	return url;
}

export class GooogleSlidesGenerator {
	private oauth2Client: OAuth2Client;

	constructor(oauth2Client: OAuth2Client);
	constructor({
		clientId,
		clientSecret,
		redirectUri,
	}: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
	});
	constructor(
		arg1: OAuth2Client | { clientId: string; clientSecret: string; redirectUri: string },
	) {
		if (arg1 instanceof OAuth2Client) {
			this.oauth2Client = arg1;
		} else {
			const { clientId, clientSecret, redirectUri } = arg1;
			this.oauth2Client = new OAuth2Client({
				clientId,
				clientSecret,
				redirectUri,
			});
		}
	}

	async createSlide(
		title: string,
		content: string,
		options?: {
			appendTo?: string;
			erase?: boolean;
			copyFrom?: string;
		},
	) {
		const appendToId = getId(options?.appendTo);
		const copyFromId = getId(options?.copyFrom);
		const css = loadCSS();

		let slideGenerator: SlideGenerator;

		console.log({
			title,
			content,
			options,
			appendToId,
			copyFromId,
		});

		if (appendToId) {
			slideGenerator = await SlideGenerator.forPresentation(this.oauth2Client, appendToId);
			if (options?.erase) {
				await slideGenerator.erase();
			}
		} else if (copyFromId) {
			slideGenerator = await SlideGenerator.copyPresentation(this.oauth2Client, title, copyFromId);
		} else {
			slideGenerator = await SlideGenerator.newPresentation(this.oauth2Client, title);
		}

		const generateSlidesId = await slideGenerator.generateFromMarkdown(content, {
			css,
			useFileio: false,
		});

		const URL = displayResults(generateSlidesId);

		return URL;
	}
}

export function connectClient(clientId: string, clientSecret: string, redirectUri: string) {
	return new OAuth2Client({
		clientId,
		clientSecret,
		// redirectUri,
	});
}
