import {defineConfig} from "vitepress";
import {existsSync, readFileSync} from "fs";
import {fileURLToPath} from "url";
import {resolve, sep} from "path";

const docsDir = fileURLToPath(new URL('../docs', import.meta.url));

export default defineConfig({
    vite: {
        plugins: [
            {
                // buildEnd publishes /raw/*.md for production; the dev server serves the same paths from source
                name: 'asena-raw-docs-dev',
                apply: 'serve',
                configureServer(server) {
                    server.middlewares.use('/raw', (req, res, next) => {
                        const file = resolve(docsDir, '.' + decodeURIComponent((req.url ?? '').split('?')[0]));

                        if (!file.startsWith(docsDir + sep) || !file.endsWith('.md') || !existsSync(file)) return next();

                        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
                        res.end(readFileSync(file));
                    });
                },
            },
        ],
    },

    title: "Asena",
    description: "High-performance IoC web framework built on Bun runtime",
    lang: "en-US",
    lastUpdated: true,
    cleanUrls: true,

    // Internal authoring guide - must never be published as a page
    srcExclude: ['CLAUDE.md'],

    async buildEnd(siteConfig) {
        const {resolve, join} = await import('path');
        const {cpSync, mkdirSync, readdirSync, statSync} = await import('fs');

        const srcDir = resolve(siteConfig.srcDir, 'docs');
        const outDir = resolve(siteConfig.outDir, 'raw');

        function copyMdFiles(src: string, dest: string) {
            mkdirSync(dest, {recursive: true});
            for (const entry of readdirSync(src)) {
                const srcPath = join(src, entry);
                const destPath = join(dest, entry);
                if (statSync(srcPath).isDirectory()) {
                    copyMdFiles(srcPath, destPath);
                } else if (entry.endsWith('.md')) {
                    cpSync(srcPath, destPath);
                }
            }
        }

        copyMdFiles(srcDir, outDir);
    },

    head: [
        ['link', { rel: 'icon', type: 'image/png', href: '/asena-logo-256.png' }],
        ['meta', { name: 'theme-color', content: '#0dc6c4' }],
        ['meta', { name: 'og:type', content: 'website' }],
        ['meta', { name: 'og:locale', content: 'en' }],
        ['meta', { name: 'og:site_name', content: 'Asena Framework' }],
        ['meta', { name: 'og:image', content: 'https://asena.sh/asena-logo-512.png' }],
    ],

    themeConfig: {
        logo: '/asena-logo.svg',

        nav: [
            {text: "Home", link: "/"},
            {text: "Docs", link: "/docs/", activeMatch: "^/docs/(?!examples|benchmarks|showcase|roadmap)"},
            {text: "Examples", link: "/docs/examples"},
            {text: "Benchmarks", link: "/docs/benchmarks"},
            {text: "Showcase", link: "/docs/showcase"},
            {text: "Roadmap", link: "/docs/roadmap"},
            {
                text: "AI",
                items: [
                    {text: "Agent Skill", link: "/docs/#ai"},
                    {text: "llms.txt", link: "/llms.txt"},
                    {text: "llms-full.txt", link: "/llms-full.txt"},
                ],
            },
        ],

        sidebar: [
            {text: "Overview", link: "/docs/"},
            {text: "Philosophy", link: "/docs/philosophy"},
            {text: "Quick Start", link: "/docs/get-started"},
            {text: "Key Concepts", link: "/docs/key-concepts"},
            {text: "Best Practices", link: "/docs/best-practices"},
            {text: "Examples", link: "/docs/examples"},
            {text: "Benchmarks", link: "/docs/benchmarks"},
            {text: "Showcase", link: "/docs/showcase"},
            {text: "Roadmap", link: "/docs/roadmap"},
            {
                text: "Migrate",
                items: [
                    {text: "Coming from NestJS", link: "/docs/migrate/from-nestjs"},
                ],
            },
            {
                text: "Concepts",
                items: [
                    {text: "Controllers", link: "/docs/concepts/controllers"},
                    {text: "Services", link: "/docs/concepts/services"},
                    {text: "Dependency Injection", link: "/docs/concepts/dependency-injection"},
                    {text: "Component Lifecycle", link: "/docs/concepts/lifecycle"},
                    {text: "Middleware", link: "/docs/concepts/middleware"},
                    {text: "Context", link: "/docs/concepts/context"},
                    {text: "Validation", link: "/docs/concepts/validation"},
                    {text: "Authentication", link: "/docs/concepts/authentication"},
                    {text: "Static File Serving", link: "/docs/concepts/static-files"},
                    {text: "WebSocket", link: "/docs/concepts/websocket"},
                    {text: "Event System", link: "/docs/concepts/event-system"},
                    {text: "Microservices", link: "/docs/concepts/microservices"},
                    {text: "Ulak", link: "/docs/concepts/ulak"},
                    {text: "Scheduled Tasks", link: "/docs/concepts/scheduled-tasks"},
                    {text: "Frontend Controller", link: "/docs/concepts/frontend-controller"},
                    {text: "PostProcessor", link: "/docs/concepts/post-processor"},
                    {text: "Inheritance", link: "/docs/concepts/inheritance"},
                ],
            },
            {
                text: "Adapters",
                items: [
                    {text: "Overview", link: "/docs/adapters/overview"},
                    {text: "Ergenecore", link: "/docs/adapters/ergenecore"},
                    {text: "Hono", link: "/docs/adapters/hono"},
                ],
            },
            {
                text: "Official Packages",
                items: [
                    {text: "Logger", link: "/docs/packages/logger"},
                    {text: "Auth", link: "/docs/packages/auth"},
                    {text: "Drizzle ORM", link: "/docs/packages/drizzle"},
                    {text: "OpenAPI", link: "/docs/packages/openapi"},
                    {text: "OpenTelemetry", link: "/docs/packages/opentelemetry"},
                    {text: "Redis", link: "/docs/packages/redis"},
                    {text: "Kafka", link: "/docs/packages/kafka"},
                ],
            },
            {
                text: "Asena CLI",
                items: [
                    {text: "Overview", link: "/docs/cli/overview"},
                    {text: "Installation", link: "/docs/cli/installation"},
                    {text: "Commands", link: "/docs/cli/commands"},
                    {text: "Configuration", link: "/docs/cli/configuration"},
                    {text: "Suffix Configuration", link: "/docs/cli/suffix-configuration"},
                    {text: "Examples", link: "/docs/cli/examples"},
                ]
            },
            {
                text: "Guides",
                items: [
                    {text: "Configuration", link: "/docs/guides/configuration"},
                    {text: "Error Handling", link: "/docs/guides/error-handling"},
                    {text: "Deployment", link: "/docs/guides/deployment"},
                ],
            },
            {
                text: "Testing",
                items: [
                    {text: "Overview", link: "/docs/testing/overview"},
                    {text: "MockComponent API", link: "/docs/testing/mock-component"},
                    {text: "createTestApp", link: "/docs/testing/test-app"},
                    {text: "createWebTest", link: "/docs/testing/web-test"},
                    {text: "Examples", link: "/docs/testing/examples"},
                ],
            },
        ],

        editLink: {
            pattern: 'https://github.com/AsenaJs/Website/edit/master/:path',
            text: 'Edit this page on GitHub'
        },

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2024-present Asena Framework'
        },

        search: {
            provider: 'local'
        },

        socialLinks: [
            {icon: "github", link: "https://github.com/AsenaJs/Asena"},
            {icon: "npm", link: "https://www.npmjs.com/package/@asenajs/asena"},
        ],
    },
});
