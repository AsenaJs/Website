import {defineConfig} from "vitepress";

export default defineConfig({
    title: "Asena",
    description: "High-performance IoC web framework built on Bun runtime",
    lang: "en-US",
    lastUpdated: true,
    cleanUrls: true,

    head: [
        ['link', { rel: 'icon', type: 'image/png', href: '/asena-logo-256.png' }],
        ['meta', { name: 'theme-color', content: '#646cff' }],
        ['meta', { name: 'og:type', content: 'website' }],
        ['meta', { name: 'og:locale', content: 'en' }],
        ['meta', { name: 'og:site_name', content: 'Asena Framework' }],
        ['meta', { name: 'og:image', content: 'https://asena.sh/asena-logo-512.png' }],
    ],

    themeConfig: {
        logo: '/asena-logo.svg',

        nav: [
            {text: "Home", link: "/"},
            {text: "Docs", link: "/docs/get-started"},
            {text: "Examples", link: "/docs/examples"},
            {text: "Showcase", link: "/docs/showcase"},
            {text: "Roadmap", link: "/docs/roadmap"},
            {text: "LLMS.txt", link: "/llms.txt"},
        ],

        sidebar: [
            {text: "Philosophy", link: "/docs/philosophy"},
            {text: "Quick Start", link: "/docs/get-started"},
            {text: "Examples", link: "/docs/examples"},
            {text: "Showcase", link: "/docs/showcase"},
            {text: "Roadmap", link: "/docs/roadmap"},
            {text: "📄 LLMS.txt", link: "/llms.txt"},
            {
                text: "Concepts",
                items: [
                    {text: "Controllers", link: "/docs/concepts/controllers"},
                    {text: "Services", link: "/docs/concepts/services"},
                    {text: "Dependency Injection", link: "/docs/concepts/dependency-injection"},
                    {text: "Middleware", link: "/docs/concepts/middleware"},
                    {text: "Context", link: "/docs/concepts/context"},
                    {text: "Validation", link: "/docs/concepts/validation"},
                    {text: "WebSocket", link: "/docs/concepts/websocket"},
                    {text: "Ulak", link: "/docs/concepts/ulak"},
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
                    {text: "Drizzle ORM", link: "/docs/packages/drizzle"},
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
