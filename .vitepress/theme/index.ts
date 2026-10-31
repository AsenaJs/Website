import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'
import './benchmarks.css'
import './site.css'
import './docs.css'
import './landing.css'
import Layout from './Layout.vue'
import CopyCmd from './components/CopyCmd.vue'
import TypeShowcase from './components/TypeShowcase.vue'
import HoverCode from './components/HoverCode.vue'
import DocDiagram from './components/DocDiagram.vue'

export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }) {
        app.component('CopyCmd', CopyCmd)
        app.component('TypeShowcase', TypeShowcase)
        app.component('HoverCode', HoverCode)
        app.component('DocDiagram', DocDiagram)
    },
} satisfies Theme
