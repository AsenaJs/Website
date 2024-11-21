import {defineConfig} from "vitepress";

export default defineConfig({
    title: "Asena",
    description: "Ioc web framework for bun",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {text: "Home", link: "/"},
            {text: "Docs", link: "/docs/get-started"},
        ],
        sidebar: [
            {text: "Quick Start", link: "/docs/get-started"},
            {text: "Examples", link: "/docs/examples"},
            {
                text: "Concepts",
                items: [
                    {text: "Context", link: "/docs/context"},
                    {text: "Dependency Injection", link: "/docs/dependency-injection"},
                    {text: "Controller", link: "/docs/controller"},
                ],
            },
        ],

        socialLinks: [
            {icon: "github", link: "https://github.com/AsenaJs/Asena"},
        ],
    },
});
