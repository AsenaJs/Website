<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import DocAiBar from './components/DocAiBar.vue'

const { Layout } = DefaultTheme
const route = useRoute()
const { page } = useData()

const showAiBar = computed(() => page.value.relativePath.startsWith('docs/') && !page.value.isNotFound)

let observer: IntersectionObserver | undefined

function revealAll() {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('in-view'))
}

function bind() {
    const targets = document.querySelectorAll('[data-reveal]:not(.in-view)')

    if (!targets.length) return

    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealAll()
        return
    }

    observer ||= new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue
                entry.target.classList.add('in-view')
                observer?.unobserve(entry.target)
            }
        },
        { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )

    targets.forEach((el) => observer!.observe(el))
}

onMounted(() => {
    document.documentElement.classList.add('lp-reveal-ready')
    bind()
    watch(
        () => route.path,
        () => nextTick(bind),
    )
})

onUnmounted(() => {
    observer?.disconnect()
    observer = undefined
})
</script>

<template>
    <Layout>
        <template #doc-before>
            <DocAiBar v-if="showAiBar" :key="page.relativePath" />
        </template>
    </Layout>
</template>
