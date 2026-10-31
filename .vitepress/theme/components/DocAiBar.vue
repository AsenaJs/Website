<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'

const SITE = 'https://asena.sh'

const { page } = useData()

const rawPath = computed(() => `/raw/${page.value.relativePath.replace(/^docs\//, '')}`)

const prompt = computed(
    () =>
        `Read ${SITE}${rawPath.value} (the "${page.value.title}" page of the Asena framework docs) ` +
        `and help me with questions about it. The full docs index is at ${SITE}/llms.txt.`,
)

const claudeUrl = computed(() => `https://claude.ai/new?q=${encodeURIComponent(prompt.value)}`)
const chatgptUrl = computed(() => `https://chatgpt.com/?q=${encodeURIComponent(prompt.value)}`)

const state = ref<'idle' | 'done' | 'failed'>('idle')
let timer: ReturnType<typeof setTimeout> | undefined

async function copyMarkdown() {
    const text = fetch(rawPath.value).then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.text()
    })
    try {
        // Safari drops the click's clipboard permission across an await; a promised ClipboardItem keeps it.
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
            await navigator.clipboard.write([new ClipboardItem({ 'text/plain': text.then((t) => new Blob([t], { type: 'text/plain' })) })])
        } else {
            await navigator.clipboard.writeText(await text)
        }
        state.value = 'done'
    } catch {
        state.value = 'failed'
    }
    clearTimeout(timer)
    timer = setTimeout(() => (state.value = 'idle'), 2000)
}
</script>

<template>
    <div class="doc-ai" role="group" aria-label="Use this page with AI">
        <button class="doc-ai-btn" :class="{ 'is-done': state === 'done' }" type="button" @click="copyMarkdown">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            {{ state === 'done' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy page as Markdown' }}
        </button>
        <a class="doc-ai-btn" :href="claudeUrl" target="_blank" rel="noopener">Open in Claude</a>
        <a class="doc-ai-btn" :href="chatgptUrl" target="_blank" rel="noopener">Open in ChatGPT</a>
        <a class="doc-ai-btn" :href="rawPath" target="_blank" rel="noopener">View .md</a>
    </div>
</template>
