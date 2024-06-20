const PHONE_URL = process.env.PHONE_URL;
const WEB_URL = process.env.WEB_URL;

interface GetContactsResponse {
	data: Contact[];
	totalCount: number;
}

interface GetCallsResponse {
	content: Call[];
	total: number;
}

interface Call {
	id: string;
	call: {
		duration: number;
		startedAt: string;
		endedAt: string;
		status: string;
		direction: string;
		caller: {
			number: string;
			displayName: string;
		};
		callee: {
			number: string;
		};
		recording: {
			link: string;
			duration: number;
		};
	};
}

interface Contact {
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

interface PhoneDetails {
	number: string;
	normalNumber: string;
	type: string;
	favorite: boolean;
}

export class OnOff {
	accessToken: string;
	personalAccessToken: string;

	constructor(accessToken: string, personalAccessToken: string) {
		this.accessToken = accessToken;
		this.personalAccessToken = personalAccessToken;
	}

	async getCalls() {
		let calls: any[] = [];

		// Make the first call to get 100 items and the total number of items
		const firstCall = await this.getCallsWithPagination(0, 100);
		calls = [...calls, ...firstCall.content];

		// Then make subsequent calls to get the rest
		const totalItems = firstCall.total;
		const numberOfCallsToMake = Math.ceil((totalItems - 100) / 100);

		for (let i = 0; i < numberOfCallsToMake; i++) {
			const call = await this.getCallsWithPagination((i + 1) * 100, 100);
			calls = [...calls, ...call.content];
		}

		return calls;
	}

	async getContacts(accessToken: string) {
		let contacts: any[] = [];

		// Make the first call to get 500 items and the total number of items
		const firstCall = await this.getContactsWithPagination(accessToken, 0, 500);
		contacts = [...contacts, ...firstCall.data];

		// Then make subsequent calls to get the rest
		const totalItems = firstCall.totalCount;
		const numberOfCallsToMake = Math.ceil((totalItems - 500) / 500);

		for (let i = 0; i < numberOfCallsToMake; i++) {
			const contact = await this.getContactsWithPagination(accessToken, (i + 1) * 500, 500);
			contacts = [...contacts, ...contact.data];
		}

		return contacts;
	}

	async getCallsWithPagination(offset: number, limit: number) {
		try {
			const response = await fetch(`${PHONE_URL}/api/calls?offset=${offset}&limit=${limit}`, {
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText);
			}

			return response.json() as Promise<GetCallsResponse>;
		} catch (error) {
			throw new Error(error);
		}
	}

	async getContactsWithPagination(offset: number, limit: number) {
		try {
			const response = await fetch(`${WEB_URL}/b2b-console/contacts`, {
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
				},
				method: 'post',
				body: JSON.stringify({
					offset,
					limit,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText);
			}

			return response.json() as Promise<GetContactsResponse>;
		} catch (error) {
			throw new Error(error);
		}
	}

	isPhoneNumber(str: string): boolean {
		// Regex for a phone number
		const phoneNumberRegex = /^\d{11}$/;
		return phoneNumberRegex.test(str);
	}

	isId(str: string): boolean {
		// Regex for an ID in the format "digits-hexadecimal-hexadecimal"
		const idRegex = /^\d{13}-[a-fA-F0-9]{12}-[a-fA-F0-9]{4}$/;
		return idRegex.test(str);
	}

	async formatPhoneNumber(phoneNumber: string) {
		// Remove non-numeric characters from the phone number
		const numericPhoneNumber = phoneNumber.replace(/\D/g, '');

		// Use a regular expression to format the phone number
		return numericPhoneNumber.replace(
			/(\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/,
			'+$1 $2 $3 $4 $5 $6',
		);
	}

	async getJwtByAccessToken(accessToken: string) {
		try {
			const response = await fetch(WEB_URL + '/b2b-console/auth/jwt', {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (!response.ok) {
				return response.text().then((text) => {
					throw new Error(text);
				});
			}

			const data = (await response.json()) as any;
			return data.body.token;
		} catch (error: any) {
			console.error('Error fetching JWT token:', error.message);
			throw error;
		}
	}

	async getThreadId(accessToken: string, phoneNumber: string) {
		try {
			const response = await fetch(PHONE_URL + '/v5/get-thread-id', {
				headers: {
					Authorization: `Basic ${accessToken}`,
					'x-user-agent': 'b2b-web/4.18.0',
					'Content-Type': 'application/json',
				},
				method: 'POST',
				body: JSON.stringify({
					creator: {
						categoryId: process.env.CREATOR_CATEGORY_ID,
					},
					receiver: {
						phoneNumbers: ['+' + phoneNumber],
					},
				}),
			});

			if (!response.ok) {
				return response.text().then((text) => {
					throw new Error(text);
				});
			}

			const result = (await response.json()) as any;

			return result.threadId;
		} catch (error: any) {
			console.error('Error getting thread id:', error.message);
		}
	}
}
