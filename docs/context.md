# Context
The `AsenaContext` interface represents the context for Asena and provides various methods to interact with the request and response objects.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `req` | `R` | The request object. |
| `res` | `S` | The response object. |
| `headers` | `Record<string, string>` | Headers associated with the request. |

#### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getArrayBuffer()` | `Promise<ArrayBuffer>` | Retrieves the request body as an ArrayBuffer. |
| `getParseBody()` | `Promise<any>` | Parses and retrieves the request body. |
| `getBlob()` | `Promise<Blob>` | Retrieves the request body as a Blob. |
| `getFormData()` | `Promise<FormData>` | Retrieves the request body as FormData. |
| `getParam(s: string)` | `string` | Retrieves a parameter from the request. |
| `getBody<U>()` | `Promise<U>` | Retrieves the request body as a specified type. |
| `getQuery(query: string)` | `Promise<string>` | Retrieves a query parameter from the request. |
| `getQueryAll(query: string)` | `Promise<string[]>` | Retrieves all values of a query parameter from the request. |
| `getCookie(name: string, secret?: string \| BufferSource)` | `Promise<string \| false>` | Retrieves a cookie from the request. |
| `setCookie(name: string, value: string, options?: CookieExtra<any>)` | `Promise<void>` | Sets a cookie in the response. |
| `deleteCookie(name: string, options?: CookieExtra<any>)` | `Promise<void>` | Deletes a cookie from the response. |
| `getValue<T>(key: string)` | `T` | Retrieves a value from the context. |
| `setValue(key: string, value: any)` | `void` | Sets a value in the context. |
| `setWebSocketValue(value: any)` | `void` | Sets a value for WebSocket communication. |
| `getWebSocketValue<T>()` | `T` | Retrieves a value for WebSocket communication. |
| `html(data: string)` | `Response \| Promise<Response>` | Sends an HTML response. |
| `send(data: string \| any, status?: SendOptions \| number)` | `Response \| Promise<Response>` | Sends a response. |
| `redirect(url: string)` | `void` | Redirects the request to a new URL. |

## Example

Not ready yet.