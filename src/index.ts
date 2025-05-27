/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// 本地开发环境无法访问外网：Miniflare 在中国大陆或部分网络环境下，无法直接 fetch Google 资源。你可以尝试部署到 Cloudflare 真正的生产环境（wrangler deploy），线上环境通常没有这个限制。

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		console.log('🔍Request URL:', url.toString());
		const targetUrl = 'https://ai.google.dev/gemini-api/docs';

		// 1. 添加请求方法验证
		if (request.method !== 'GET') {
			return new Response('Method not allowed', { status: 405 });
		}

		// 2. 增强路径验证和语言代码提取
		const pathParts = url.pathname.split('/');
		if (pathParts.length < 3 || pathParts[2] !== 'docs') {
			return new Response('Invalid path', { status: 403 });
		}
		const langCode = pathParts[1]; // 获取语言代码，如 zh-CN, ja-JP 等
		console.log('🌍Language Code:', langCode);

		// 3. 添加缓存控制
		const cacheKey = url.toString();
		console.log('🔑Cache Key:', cacheKey);
		const cache = caches.default;
		let response = await cache.match(cacheKey);

		if (!response) {
			try {
				// 移除语言代码和 docs 前缀，保留剩余路径
				const targetPath = pathParts.slice(3).join('/');
				console.log('🎯Target Path:', targetPath);
				// 确保路径以 / 开头，如果为空则使用 /
				const path = targetPath ? `/${targetPath}` : '/';
				// 如果路径为空，则使用 ""
				const finalPath = path === '/' ? '' : path;
				console.log('🚨Final Path:', finalPath);

				// 构建查询参数
				const searchParams = new URLSearchParams(url.search);
				searchParams.set('hl', langCode.toLowerCase());
				const finalUrl = new URL(targetUrl + finalPath + '?' + searchParams.toString());
				console.log('🚨Final URL:', finalUrl.toString());

				// 添加超时控制
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

				response = await fetch(finalUrl.toString(), {
					headers: {
						'User-Agent': request.headers.get('User-Agent') || '',
						'Accept': request.headers.get('Accept') || '*/*',
						// 'Accept-Language': request.headers.get('Accept-Language') || '*', // 可选，通常不需要
					},
					redirect: 'manual',
					signal: controller.signal
				});

				clearTimeout(timeoutId);

				// 4. 设置缓存
				const headers = new Headers(response.headers);
				headers.set('Cache-Control', 'public, max-age=3600');
				headers.set('Access-Control-Allow-Origin', '*');
				headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
				headers.set('Access-Control-Allow-Headers', '*');

				response = new Response(response.body, {
					status: response.status,
					headers
				});

				ctx.waitUntil(cache.put(cacheKey, response.clone()));
			} catch (error) {
				console.error('❌Error fetching target URL:', error);
				if (error && typeof error === 'object') {
					console.error('❌Error details:', (error as any).message, (error as any).stack);
				}
				return new Response('Failed to fetch target URL', {
					status: 502,
					headers: {
						'Content-Type': 'text/plain',
						'Access-Control-Allow-Origin': '*'
					}
				});
			}
		}

		return response;
	}
} satisfies ExportedHandler<Env>;