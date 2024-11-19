import {defineConfig} from "vitepress";

export default defineConfig({
    title: "Asena",
    base: "/website/",
    description: "Ioc web framework for bun",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {text: "Home", link: "/"},
            {text: "Docs", link: "/get-started"},
        ],
        sidebar: [
            {text: "Quick Start", link: "/get-started"},
            {text: "Examples", link: "/examples"},
            {
                text: "Concepts",
                items: [
                    {text: "Controller", link: "/controller"},
                ],
            },
        ],

        socialLinks: [
            {icon: "github", link: "https://github.com/AsenaJs/Asena"},
        ],
    },
});
