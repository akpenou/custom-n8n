import path from 'path';
import fetch from 'node-fetch';
import dayjs from 'dayjs';

const PHONE_URL = 'https://production-server.onoffapp.net/mobile';
const WEB_URL = 'https://web.onoffbusiness.com';

interface IOnOff {
	getCalls(): Promise<Call[]>;
	getContacts(): Promise<Contact[]>;
	upsertContact(idPhone: string, data: { [key: string]: any }): Promise<any>;
	sendMessage(phoneNumber: string, content: string): Promise<any>;
	getJwtByAccessToken(): Promise<string>;
}

export interface GetContactsResponse {
	data: Contact[];
	totalCount: number;
}

export interface GetCallsResponse {
	content: Call[];
	total: number;
}

export interface Call {
	id: string;
	call: CallDetails;
}

export interface CallDetails {
	duration: number;
	startedAt: string;
	endedAt: string;
	status: string;
	direction: string;
	caller: Caller;
	callee: Caller;
	recording: Recording;
}

export interface Caller {
	number: string;
	displayName?: string;
}

export interface Recording {
	link: string;
	duration: number;
}

export interface Contact {
	id: string;
	created: string;
	updated: string;
	userId: string;
	firstName: string;
	lastName: string;
	phoneBookId: string;
	deleted: boolean;
	manual: boolean;
	blocked: boolean;
	phones: PhoneDetails[];
}

export interface PhoneDetails {
	number: string;
	normalNumber: string;
	type: string;
	favorite: boolean;
}

interface ContactPayloadApi {
	blocked?: boolean;
	favorite: boolean;
	firstName: string;
	lastName: string;
	imageUrl: string;
	company: string;
	phones: Phone[];
	emails?: Email[];
	categoryId: string;
	notes: string;
	id?: string;
	phoneBookId: string;
}

interface Phone {
	type: string;
	favorite: boolean;
	normalNumber: string;
	number: string;
}

interface Email {
	type: string;
	email: string;
}

export class OnOff implements IOnOff {
	private PHONE_URL = PHONE_URL;
	private WEB_URL = WEB_URL;
	private accessToken: string;

	constructor(accessToken: string) {
		this.accessToken = accessToken;
	}

	private async fetch<T>(
		path: string,
		options?: {
			headers?: Record<string, string>;
			method?: 'GET' | 'POST';
			body?: object;
			params?: Record<string, string | number | boolean>;
		},
	) {
		if (!this.accessToken && !options?.headers?.Authorization) {
			throw new Error('Access token is missing');
		}

		const headers = {
			Authorization: `Bearer ${this.accessToken}`,
			'x-user-agent': 'b2b-web/4.18.0',
			'Content-Type': 'application/json',
			...options?.headers,
		};

		const url = path.startsWith('/') ? `${this.WEB_URL}${path}` : path;

		const urlWithParams = new URL(url);
		if (options?.params) {
			Object.entries(options.params).forEach(([key, value]) => {
				urlWithParams.searchParams.set(key, String(value));
			});
		}

		const response = await fetch(urlWithParams.toString(), {
			headers,
			method: options?.method ?? 'GET',
			body: options?.body ? JSON.stringify(options?.body) : undefined,
		});

		if (!response.ok) {
			return response.text().then((text) => {
				console.error('Error fetching call files list:', text);

				throw new Error(text);
			});
		}

		const res: T = await response.json();

		return res;
	}

	private async fetchPhone<T>(
		path: string,
		options?: {
			headers?: Record<string, string>;
			method?: 'GET' | 'POST';
			body?: object;
			params?: Record<string, string | number | boolean>;
		},
	) {
		const url = path.startsWith('/') ? `${this.PHONE_URL}${path}` : path;
		return this.fetch<T>(url, options);
	}

	async getCalls(options?: { fromDate?: string; toDate?: string }): Promise<Call[]> {
		let calls: Call[] = [];

		const firstCall = await this.getCallsWithPagination(0, 100);
		calls = [...calls, ...firstCall.content];

		const totalItems = firstCall.total;
		const numberOfCallsToMake = Math.ceil((totalItems - 100) / 100);

		console.dir({
			totalItems,
			numberOfCallsToMake,
			calls: calls.length,
		});
		for (let i = 0; i < numberOfCallsToMake; i++) {
			const call = await this.getCallsWithPagination((i + 1) * 100, 100);
			calls = [...calls, ...call.content];
		}

		return calls;
	}

	async getContacts(): Promise<Contact[]> {
		let contacts: Contact[] = [];

		const firstCall = await this.getContactsWithPagination(0, 500);
		contacts = [...contacts, ...firstCall.data];

		const totalItems = firstCall.totalCount;
		const numberOfCallsToMake = Math.ceil((totalItems - 500) / 500);

		for (let i = 0; i < numberOfCallsToMake; i++) {
			const contact = await this.getContactsWithPagination((i + 1) * 500, 500);
			contacts = [...contacts, ...contact.data];
		}

		return contacts;
	}

	private async getCallsWithPagination(
		offset: number,
		limit: number,
		hasRecording: boolean = true,
		options?: {
			fromDate?: string;
			toDate?: string;
		},
	): Promise<GetCallsResponse> {
		try {
			const fromDate = options?.fromDate
				? dayjs(options.fromDate).valueOf()
				: dayjs().subtract(52, 'week').valueOf();
			const toDate = options?.toDate ? dayjs(options.toDate).valueOf() : dayjs().valueOf();

			const response = await this.fetch<GetCallsResponse>('/b2b-console/calls/logs', {
				method: 'POST',
				body: {
					offset,
					limit,
					hasRecording,
					startedTo: toDate,
					startedFrom: fromDate,
				},
			});

			return response;
		} catch (error: any) {
			console.error('Error fetching call files list:', error.message);
			throw new Error('Error fetching call files list:', error.message);
		}
	}

	async downloadCall(callId: string): Promise<File> {
		const calls = await this.getCalls();

		const call = calls.find((c) => c.id === callId);
		const jwt = await this.getJwtByAccessToken();

		if (!call) {
			throw new Error('Call not found');
		}

		const fileUrl = call.call.recording.link;

		const response = await fetch(fileUrl, {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(errorText);
		}

		const fileName = path.basename(fileUrl);
		const fileContent = await response.arrayBuffer();
		const blob = new Blob([fileContent], { type: 'audio/mpeg' });
		const file = new File([blob], fileName, { type: 'audio/mpeg' });
		return file;
	}

	private async getContactsWithPagination(
		offset: number,
		limit: number,
	): Promise<GetContactsResponse> {
		try {
			const data = await this.fetchPhone<GetContactsResponse>(`/v2/get-simple-contacts`, {
				method: 'GET',
				params: {
					offset,
					limit,
					inclCounter: true,
				},
			});

			return data;
		} catch (error: any) {
			throw new Error('Error fetching contacts list:', error.message);
		}
	}

	async upsertContact(idPhone: string, data: Partial<ContactPayloadApi>): Promise<{ id: string }> {
		try {
			if (!this.isPhoneNumber(idPhone) && !this.isId(idPhone)) {
				throw new Error('Invalid id or phone');
			}

			if (this.isPhoneNumber(idPhone)) {
				data['phones'] = [
					{
						type: 'Mobile',
						normalNumber: idPhone,
						number: `+${idPhone}`,
						favorite: true,
					},
				];
			}

			if (this.isId(idPhone)) {
				data.id = idPhone;
			}

			const response = await this.fetchPhone<{ id: string }>(PHONE_URL + '/save-simple-contact', {
				method: 'POST',
				body: data,
			});

			return response;
		} catch (error: any) {
			console.error('Error while saving contact:', error.message);
			throw new Error('Error while saving contact:', error.message);
		}
	}

	async sendMessage(phoneNumber: string, content: string): Promise<any> {
		const threadId = await this.getThreadId(phoneNumber);

		try {
			const response = await this.fetchPhone('/v4/send-message', {
				method: 'POST',
				body: {
					messageType: 'TEXT',
					content: content,
					threadId: threadId,
				},
			});

			return response;
		} catch (error: any) {
			console.error('Error sending message:', error.message);
		}
	}

	private async getThreadId(phoneNumber: string): Promise<string> {
		try {
			const response = await this.fetchPhone<{ threadId: string }>('/v5/get-thread-id', {
				method: 'POST',
				body: {
					creator: {
						categoryId: process.env.CREATOR_CATEGORY_ID,
					},
					receiver: {
						phoneNumbers: ['+' + phoneNumber],
					},
				},
			});

			return response.threadId;
		} catch (error: any) {
			throw new Error('Error getting thread id:', error.message);
		}
	}

	private isPhoneNumber(str: string): boolean {
		const phoneNumberRegex = /^\d{11}$/;
		return phoneNumberRegex.test(str);
	}

	private isId(str: string): boolean {
		const idRegex = /^\d{13}-[a-fA-F0-9]{12}-[a-fA-F0-9]{4}$/;
		return idRegex.test(str);
	}

	formatPhoneNumber(phoneNumber: string): string {
		const numericPhoneNumber = phoneNumber.replace(/\D/g, '');

		return numericPhoneNumber.replace(
			/(\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/,
			'+$1 $2 $3 $4 $5 $6',
		);
	}

	async getJwtByAccessToken(): Promise<string> {
		try {
			const response = await this.fetch<{
				body: {
					token: string;
				};
			}>('/b2b-console/auth/jwt');

			return response.body.token;
		} catch (error: any) {
			console.error('Error fetching JWT token:', error.message);
			throw error;
		}
	}
}
