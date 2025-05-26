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

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// 获取请求的 URL
		const url = new URL(request.url);

		// 只允许 /docs 路径
		if (!url.pathname.startsWith("/docs")) {
			return new Response("Not found", { status: 404 });
		}

		// 只允许 /docs 下的三级以内路径
		const allowed = /^\/docs(\/([a-zA-Z0-9\-]+)){0,2}(\?.*)?$/;
		if (!allowed.test(url.pathname + (url.search || ""))) {
			return new Response("Forbidden", { status: 403 });
		}
		// 拼接目标 Google 文档地址
		const googleBase = "https://ai.google.dev/gemini-api";
		const targetUrl = googleBase + url.pathname + (url.search || "");

		// 代理请求 Google
		const res = await fetch(targetUrl, {
			headers: {
				"User-Agent": request.headers.get("user-agent") || "",
				"Accept": "text/html,application/xhtml+xml,application/xml",
			},
		});

		if (!res.ok) {
			return new Response("获取文档失败", { status: 502 });
		}

		const html = await res.text();
		return new Response(html, {
			status: res.status,
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				"Access-Control-Allow-Origin": "*",
			},
		});
	},
} satisfies ExportedHandler<Env>;
