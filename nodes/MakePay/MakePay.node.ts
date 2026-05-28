import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type JsonObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

const DEFAULT_BASE_URL = 'https://www.makecrypto.io';

type MaybeObject = IDataObject | IDataObject[] | string | number | boolean | null | undefined;

function cleanObject(value: IDataObject): IDataObject {
	return Object.fromEntries(
		Object.entries(value).filter(([, field]) => field !== undefined && field !== null && field !== ''),
	);
}

function getBaseUrl(credentials: IDataObject): string {
	const value = credentials.baseUrl;
	if (typeof value === 'string' && value.trim()) {
		return value.replace(/\/+$/, '');
	}
	return DEFAULT_BASE_URL;
}

function parseJsonParameter(value: MaybeObject): IDataObject {
	if (!value) {
		return {};
	}
	if (typeof value === 'string') {
		return JSON.parse(value) as IDataObject;
	}
	if (Array.isArray(value)) {
		return { items: value };
	}
	if (typeof value === 'object') {
		return value;
	}
	return {};
}

function asArray(value: MaybeObject, keys: string[]): IDataObject[] {
	if (Array.isArray(value)) {
		return value;
	}
	if (!value || typeof value !== 'object') {
		return [];
	}
	for (const key of keys) {
		const candidate = value[key];
		if (Array.isArray(candidate)) {
			return candidate as IDataObject[];
		}
	}
	return [];
}

function normalizePartnerPath(this: IExecuteFunctions, path: string, itemIndex: number): string {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	if (!normalized.startsWith('/api/partner/v1/makepay/')) {
		throw new NodeOperationError(
			this.getNode(),
			'Custom API calls must use a /api/partner/v1/makepay/ path.',
			{ itemIndex },
		);
	}
	return normalized;
}

async function makePayRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	baseUrl: string,
	path: string,
	qs: IDataObject = {},
	body?: IDataObject,
): Promise<MaybeObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${path}`,
		qs: cleanObject(qs),
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	return await this.helpers.httpRequestWithAuthentication.call(this, 'makePayApi', options);
}

export class MakePay implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MakePay',
		name: 'makePay',
		icon: { light: 'file:../../icons/makepay.svg', dark: 'file:../../icons/makepay.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create MakePay payment links, customers, bookkeeping invoices, and API requests',
		defaults: {
			name: 'MakePay',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'makePayApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'API',
						value: 'api',
					},
					{
						name: 'Bookkeeping Invoice',
						value: 'bookkeepingInvoice',
					},
					{
						name: 'Customer',
						value: 'customer',
					},
					{
						name: 'Payment Link',
						value: 'paymentLink',
					},
					{
						name: 'Webhook Request',
						value: 'webhookRequest',
					},
				],
				default: 'paymentLink',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['paymentLink'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a payment link',
						description: 'Create a hosted MakePay payment link',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a payment link',
						description: 'Get one MakePay payment link by UID',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many payment links',
						description: 'List MakePay payment links',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['customer'],
					},
				},
				options: [
					{
						name: 'Create or Update',
						value: 'create',
						action: 'Create or update a customer',
						description: 'Create or update a MakePay customer record',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['bookkeepingInvoice'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a bookkeeping invoice',
						description: 'Create a MakePay bookkeeping invoice',
					},
					{
						name: 'Create Payment Link',
						value: 'createPaymentLink',
						action: 'Create an invoice payment link',
						description: 'Create a MakePay payment link for a bookkeeping invoice',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['webhookRequest'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many webhook requests',
						description: 'List recent MakePay webhook delivery attempts',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['api'],
					},
				},
				options: [
					{
						name: 'Make Request',
						value: 'request',
						action: 'Make a request',
						description: 'Call a MakePay partner API endpoint',
					},
				],
				default: 'request',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
				description: 'Title shown on the MakePay checkout page',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink', 'bookkeepingInvoice'],
						operation: ['create'],
					},
				},
				description: 'Decimal amount as a string, for example 129.99',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink', 'bookkeepingInvoice'],
						operation: ['create'],
					},
				},
				description: 'Currency code or settlement currency, for example USDT',
			},
			{
				displayName: 'Asset',
				name: 'asset',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Customer Email',
				name: 'customerEmail',
				type: 'string',
				placeholder: 'name@example.com',
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink', 'customer', 'bookkeepingInvoice'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Customer Name',
				name: 'customerName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['bookkeepingInvoice'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@example.com',
				default: '',
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink', 'bookkeepingInvoice'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Order ID',
				name: 'orderId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Merchant Order ID',
				name: 'merchantOrderId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Client ID',
				name: 'clientId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink', 'customer'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Return URL',
				name: 'returnUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Success URL',
				name: 'successUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Failure URL',
				name: 'failureUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{
						name: 'Active',
						value: 'active',
					},
					{
						name: 'Draft',
						value: 'draft',
					},
				],
				default: 'active',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Send Payment Request Email',
				name: 'sendPaymentRequestEmail',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['paymentLink', 'bookkeepingInvoice'],
						operation: ['create', 'createPaymentLink'],
					},
				},
			},
			{
				displayName: 'Payment Link UID',
				name: 'uid',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['get'],
					},
				},
			},
			{
				displayName: 'Invoice ID',
				name: 'invoiceId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['bookkeepingInvoice'],
						operation: ['createPaymentLink'],
					},
				},
			},
			{
				displayName: 'Invoice Number',
				name: 'invoiceNumber',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['bookkeepingInvoice'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						resource: ['bookkeepingInvoice'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Status Filter',
				name: 'statusFilter',
				type: 'options',
					options: [
						{
							name: 'Active',
							value: 'active',
						},
						{
							name: 'Any',
							value: '',
						},
						{
							name: 'Expired',
							value: 'expired',
						},
						{
							name: 'Failed',
							value: 'failed',
						},
						{
							name: 'Paid',
							value: 'paid',
						},
					],
				default: '',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['getAll'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
					default: 50,
				displayOptions: {
					show: {
						resource: ['paymentLink', 'webhookRequest'],
						operation: ['getAll'],
					},
				},
					description: 'Max number of results to return',
			},
			{
				displayName: 'Method',
				name: 'method',
				type: 'options',
					options: [
						{
							name: 'DELETE',
							value: 'DELETE',
						},
						{
							name: 'GET',
							value: 'GET',
						},
						{
							name: 'PATCH',
							value: 'PATCH',
						},
						{
							name: 'POST',
							value: 'POST',
						},
						{
							name: 'PUT',
							value: 'PUT',
						},
					],
				default: 'GET',
				displayOptions: {
					show: {
						resource: ['api'],
						operation: ['request'],
					},
				},
			},
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '/api/partner/v1/makepay/settings',
				required: true,
				displayOptions: {
					show: {
						resource: ['api'],
						operation: ['request'],
					},
				},
				description: 'MakePay partner API path beginning with /api/partner/v1/makepay/',
			},
			{
				displayName: 'Query String',
				name: 'query',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						resource: ['api'],
						operation: ['request'],
					},
				},
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						resource: ['api'],
						operation: ['request'],
					},
					hide: {
						method: ['GET', 'DELETE'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('makePayApi');
		const baseUrl = getBaseUrl(credentials);

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				let response: MaybeObject;

				if (resource === 'paymentLink' && operation === 'create') {
					response = await this.helpers.httpRequestWithAuthentication.call(this, 'makePayApi', {
						method: 'POST',
						url: `${baseUrl}/api/partner/v1/makepay/payment-links`,
						json: true,
						body: {
							status: this.getNodeParameter('status', itemIndex, 'active') as string,
							sendPaymentRequestEmail: this.getNodeParameter(
								'sendPaymentRequestEmail',
								itemIndex,
								false,
							) as boolean,
							payload: cleanObject({
								title: this.getNodeParameter('title', itemIndex) as string,
								amount: this.getNodeParameter('amount', itemIndex, '') as string,
								currency: this.getNodeParameter('currency', itemIndex, '') as string,
								asset: this.getNodeParameter('asset', itemIndex, '') as string,
								customerEmail: this.getNodeParameter('customerEmail', itemIndex, '') as string,
								description: this.getNodeParameter('description', itemIndex, '') as string,
								orderId: this.getNodeParameter('orderId', itemIndex, '') as string,
								merchantOrderId: this.getNodeParameter('merchantOrderId', itemIndex, '') as string,
								clientId: this.getNodeParameter('clientId', itemIndex, '') as string,
								returnUrl: this.getNodeParameter('returnUrl', itemIndex, '') as string,
								successUrl: this.getNodeParameter('successUrl', itemIndex, '') as string,
								failureUrl: this.getNodeParameter('failureUrl', itemIndex, '') as string,
							}),
						},
					});
				} else if (resource === 'paymentLink' && operation === 'get') {
					const uid = encodeURIComponent(this.getNodeParameter('uid', itemIndex) as string);
					response = await makePayRequest.call(
						this,
						'GET',
						baseUrl,
						`/api/partner/v1/makepay/payment-links/${uid}`,
					);
				} else if (resource === 'paymentLink' && operation === 'getAll') {
					const payload = await makePayRequest.call(this, 'GET', baseUrl, '/api/partner/v1/makepay/payment-links', {
						limit: this.getNodeParameter('limit', itemIndex, 50) as number,
						status: this.getNodeParameter('statusFilter', itemIndex, '') as string,
					});
					response = asArray(payload, ['paymentLinks', 'items', 'data']);
				} else if (resource === 'customer' && operation === 'create') {
					response = await makePayRequest.call(this, 'POST', baseUrl, '/api/partner/v1/makepay/customers', {}, cleanObject({
						email: this.getNodeParameter('email', itemIndex, '') as string,
						customerEmail: this.getNodeParameter('customerEmail', itemIndex, '') as string,
						name: this.getNodeParameter('name', itemIndex, '') as string,
						clientId: this.getNodeParameter('clientId', itemIndex, '') as string,
					}));
				} else if (resource === 'bookkeepingInvoice' && operation === 'create') {
					response = await makePayRequest.call(this, 'POST', baseUrl, '/api/partner/v1/makepay/bookkeeping/invoices', {}, cleanObject({
						invoiceNumber: this.getNodeParameter('invoiceNumber', itemIndex, '') as string,
						customerEmail: this.getNodeParameter('customerEmail', itemIndex, '') as string,
						customerName: this.getNodeParameter('customerName', itemIndex, '') as string,
						amount: this.getNodeParameter('amount', itemIndex, '') as string,
						currency: this.getNodeParameter('currency', itemIndex, '') as string,
						dueDate: this.getNodeParameter('dueDate', itemIndex, '') as string,
						description: this.getNodeParameter('description', itemIndex, '') as string,
					}));
				} else if (resource === 'bookkeepingInvoice' && operation === 'createPaymentLink') {
					const invoiceId = encodeURIComponent(
						this.getNodeParameter('invoiceId', itemIndex) as string,
					);
					response = await makePayRequest.call(
						this,
						'POST',
						baseUrl,
						`/api/partner/v1/makepay/bookkeeping/invoices/${invoiceId}/payment-link`,
						{},
						{
							sendPaymentRequestEmail: this.getNodeParameter(
								'sendPaymentRequestEmail',
								itemIndex,
								false,
							) as boolean,
						},
					);
				} else if (resource === 'webhookRequest' && operation === 'getAll') {
					const payload = await makePayRequest.call(
						this,
						'GET',
						baseUrl,
						'/api/partner/v1/makepay/webhook-requests',
						{
								limit: this.getNodeParameter('limit', itemIndex, 50) as number,
						},
					);
					response = asArray(payload, ['webhookRequests', 'items', 'data']);
				} else if (resource === 'api' && operation === 'request') {
					const method = this.getNodeParameter('method', itemIndex) as IHttpRequestMethods;
					const path = normalizePartnerPath.call(
						this,
						this.getNodeParameter('path', itemIndex) as string,
						itemIndex,
					);
					const query = parseJsonParameter(
						this.getNodeParameter('query', itemIndex, {}) as MaybeObject,
					);
					const body =
						method === 'GET' || method === 'DELETE'
							? undefined
							: parseJsonParameter(
									this.getNodeParameter('body', itemIndex, {}) as MaybeObject,
								);
					response = await makePayRequest.call(this, method, baseUrl, path, query, body);
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Unsupported MakePay operation: ${resource}.${operation}`,
						{ itemIndex },
					);
				}

				const output = Array.isArray(response) ? response : [response as IDataObject];
				for (const json of output) {
					returnData.push({
						json: json ?? {},
						pairedItem: {
							item: itemIndex,
						},
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : 'Unknown MakePay error',
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
			}
		}

		return [returnData];
	}
}
