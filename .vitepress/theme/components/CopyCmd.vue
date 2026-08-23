<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ cmd: string; prefix?: string }>(), {
    prefix: '$',
})

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
    try {
        await navigator.clipboard.writeText(props.cmd)
    } catch {
        return
    }

    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
    <button class="lp-cmd" type="button" :aria-label="`Copy: ${cmd}`" @click="copy">
        <span class="lp-cmd-prefix">{{ prefix }}</span>
        <code class="lp-cmd-text">{{ cmd }}</code>
        <span class="lp-cmd-icon" :class="{ 'is-copied': copied }">
            <svg v-if="copied" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        </span>
    </button>
</template>
