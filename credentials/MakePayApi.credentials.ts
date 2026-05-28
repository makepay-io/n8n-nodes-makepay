import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MakePayApi implements ICredentialType {
	name = 'makePayApi';

	displayName = 'MakePay API';

	icon: Icon = { light: 'file:../icons/makepay.svg', dark: 'file:../icons/makepay.dark.svg' };

	documentationUrl = 'https://github.com/makecryptoio/n8n-nodes-makepay#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'MakePay Key ID',
			name: 'keyId',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'MakePay Key Secret',
			name: 'keySecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Partner API Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://www.makecrypto.io',
			required: true,
			description: 'Use the default unless MakePay support provides a different partner API host',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'X-MakeCrypto-Key-Id': '={{$credentials?.keyId}}',
				'X-MakeCrypto-Key-Secret': '={{$credentials?.keySecret}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl}}',
			url: '/api/partner/v1/makepay/settings',
			method: 'GET',
		},
	};
}
