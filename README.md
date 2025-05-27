# Gemini API 文档代理

这是一个用于代理 Google Gemini API 文档的 Cloudflare Worker，支持多语言访问。

## URL 映射表

|本地/云端|请求网址 |目标网址|
|--|--|--|
|本地|<http://localhost:3000/zh-CN/docs>|<https://ai.google.dev/gemini-api/docs?hl=zh-cn>|
|本地|<http://localhost:3000/zh-CN/docs/quickstart>|<https://ai.google.dev/gemini-api/docs/quickstart?hl=zh-cn>|
|本地|<http://localhost:3000/zh-CN/docs/document-processing?lang=python>|<https://ai.google.dev/gemini-api/docs/document-processing?hl=zh-cn&lang=python>|
|云端|<https://gemini-api-doc-proxy.yjai.app/zh-CN/docs>|<https://ai.google.dev/gemini-api/docs?hl=zh-cn>|
|云端|<https://gemini-api-doc-proxy.yjai.app/zh-CN/docs/quickstart>|<https://ai.google.dev/gemini-api/docs/quickstart?hl=zh-cn>|
|云端|<https://gemini-api-doc-proxy.yjai.app/zh-CN/docs/document-processing?lang=python>|<https://ai.google.dev/gemini-api/docs/document-processing?hl=zh-cn&lang=python>|

## URL 路径处理说明

### 1. 基础 URL 结构

```typescript
const targetUrl = 'https://ai.google.dev/gemini-api/docs';
```

基础 URL 由以下部分组成：

- 协议：`https://`
- 域名：`ai.google.dev`
- API 路径：`/gemini-api`
- 文档路径：`/docs`

### 2. 语言代码处理

```typescript
// 从 URL 路径中提取语言代码
const pathParts = url.pathname.split('/');
const langCode = pathParts[1]; // 例如：zh-CN, en-US 等

// 转换为小写并设置查询参数
const searchParams = new URLSearchParams(url.search);
searchParams.set('hl', langCode.toLowerCase()); // 例如：hl=zh-cn
```

### 3. 路径处理流程

```typescript
// 示例输入：/zh-CN/docs/quickstart

// 1. 分割路径
const pathParts = url.pathname.split('/');
// 结果：['', 'zh-CN', 'docs', 'quickstart']

// 2. 移除语言代码和 docs 前缀
const targetPath = pathParts.slice(3).join('/');
// 结果：'quickstart'

// 3. 确保路径以 / 开头
const path = targetPath ? `/${targetPath}` : '/';
// 结果：'/quickstart'

// 4. 处理空路径情况
const finalPath = path === '/' ? '' : path;
// 结果：'/quickstart'
```

### 4. 最终 URL 构造

```typescript
const finalUrl = new URL(targetUrl + finalPath + '?' + searchParams.toString());
```

URL 结构：
<https://ai.google.dev/gemini-api/docs[/path]?hl=语言代码>

示例：

- 访问首页：`https://ai.google.dev/gemini-api/docs?hl=zh-cn`
- 访问快速开始：`https://ai.google.dev/gemini-api/docs/quickstart?hl=zh-cn`
- 访问其他页面：`https://ai.google.dev/gemini-api/docs/其他路径?hl=zh-cn`

### 5. 完整处理流程示例

#### 本地

输入 URL：`http://localhost:8787/zh-CN/docs/quickstart`

处理步骤：

1. 提取语言代码：`zh-CN` -> `hl=zh-cn`
2. 处理路径：
   - 原始路径：`/zh-CN/docs/quickstart`
   - 移除前缀：`quickstart`
   - 添加斜杠：`/quickstart`
3. 构造最终 URL：`https://ai.google.dev/gemini-api/docs/quickstart?hl=zh-cn`

#### 云端

输入 URL：`https://gemini-api-doc-proxy.yjai.app/zh-CN/docs/quickstart`

处理步骤：

1. 提取语言代码：`zh-CN` -> `hl=zh-cn`
2. 处理路径：
   - 原始路径：`/zh-CN/docs/quickstart`
   - 移除前缀：`quickstart`
   - 添加斜杠：`/quickstart`
3. 构造最终 URL：`https://ai.google.dev/gemini-api/docs/quickstart?hl=zh-cn`

## 开发说明

1. 安装依赖：

    ```bash
    pnpm install
    ```

2. 本地开发：

    ```bash
    npm run dev
    ```

3. 部署：

    ```bash
    npm run deploy
    ```

## VPN设置

```cmd
set HTTPS_PROXY=http://127.0.0.1:10808
set HTTP_PROXY=http://127.0.0.1:10808
npx wrangler dev
```
