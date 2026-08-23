import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'
import './benchmarks.css'
import './site.css'
import './docs.css'
import './landing.css'
import Layout from './Layout.vue'
import CopyCmd from './components/CopyCmd.vue'

export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }) {
        app.component('CopyCmd', CopyCmd)
    },
} satisfies Theme
