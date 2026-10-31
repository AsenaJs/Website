<script setup lang="ts">
import { computed, ref } from 'vue'
import { SNIPPETS, type HoverTip } from './hover-snippets'

type Tok = { t: string; c?: string; tip?: HoverTip }

const props = defineProps<{ id: string }>()

const KEYWORDS = new Set([
    'import', 'from', 'class', 'extends', 'export', 'async', 'await', 'return', 'const', 'let', 'new',
    'for', 'of', 'if', 'interface', 'type', 'protected', 'private', 'public', 'true', 'false',
])
const PRIMITIVES = new Set(['string', 'number', 'boolean', 'null', 'undefined', 'never', 'any', 'unknown', 'void'])

function tokenize(line: string, tips: Record<string, HoverTip>): Tok[] {
    const out: Tok[] = []
    const re = /⟦(\w+)\|([^⟧]+)⟧|(\/\/.*$)|('[^']*'|"[^"]*"|`[^`]*`)|(@\w+)|(\b\d+\b)|(\b[A-Za-z_$][\w$]*\b)|(\s+)|(.)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(line))) {
        if (m[1]) {
            const inner = tokenize(m[2], {})[0]
            out.push({ t: m[2], c: inner?.c === 'str' ? 'str' : 'prop', tip: tips[m[1]] })
        } else if (m[3]) out.push({ t: m[3], c: 'cm' })
        else if (m[4]) out.push({ t: m[4], c: 'str' })
        else if (m[5]) out.push({ t: m[5], c: 'deco' })
        else if (m[6]) out.push({ t: m[6], c: 'num' })
        else if (m[7]) {
            const w = m[7]
            const rest = line.slice(re.lastIndex)
            if (KEYWORDS.has(w)) out.push({ t: w, c: 'kw' })
            else if (PRIMITIVES.has(w) || /^[A-Z]/.test(w)) out.push({ t: w, c: 'type' })
            else if (/^\??:/.test(rest)) out.push({ t: w, c: 'prop' })
            else if (rest.trimStart()[0] === '(') out.push({ t: w, c: 'fn' })
            else out.push({ t: w, c: 'id' })
        } else out.push({ t: m[0], c: m[8] ? undefined : 'punct' })
    }
    return out
}

const snippet = computed(() => SNIPPETS[props.id])
const active = ref(0)
const lines = computed(() => {
    const s = snippet.value
    return s ? s.files[active.value].code.split('\n').map((l) => tokenize(l, s.tips)) : []
})

// Keeps the tooltip inside the code window: starts at the anchor, shifts left only as far as needed.
function place(e: Event) {
    const anchor = e.currentTarget as HTMLElement
    const tip = anchor.querySelector<HTMLElement>('.ts-tip')
    const box = anchor.closest('.glass-code')?.getBoundingClientRect()
    if (!tip || !box) return
    const a = anchor.getBoundingClientRect()
    const left = Math.min(-12, box.right - 12 - a.left - tip.offsetWidth)
    tip.style.left = `${Math.max(left, box.left + 12 - a.left)}px`
}

// Errors read as prose: only quoted names are coloured.
function tipTokens(tip: HoverTip): Tok[] {
    if (!tip.error) return tokenize(tip.text, {})
    return tip.text.split(/('[^']*')/).filter(Boolean).map((t) => ({ t, c: t.startsWith("'") ? 'str' : undefined }))
}
</script>

<template>
    <div v-if="snippet" class="glass-code vp-raw" :class="{ 'has-tabs': snippet.files.length > 1 }">
        <div v-if="snippet.files.length > 1" class="glass-tabs" role="tablist">
            <button
                v-for="(f, i) in snippet.files"
                :key="f.name"
                :class="{ on: active === i }"
                role="tab"
                :aria-selected="active === i"
                @click="active = i"
            >{{ f.name }}</button>
        </div>
        <pre><code><span v-for="(line, i) in lines" :key="`${active}-${i}`" class="ln"><span v-for="(tk, j) in line" :key="j" :class="[tk.c, tk.tip && 'anchor', tk.tip?.error && 'is-error']" :tabindex="tk.tip ? 0 : undefined" @mouseenter="tk.tip && place($event)" @focus="tk.tip && place($event)">{{ tk.t }}<span v-if="tk.tip" class="ts-tip" :class="{ 'is-err': tk.tip.error }" role="tooltip"><span v-for="(p, k) in tipTokens(tk.tip)" :key="k" :class="p.c">{{ p.t }}</span></span></span>
</span></code></pre>
    </div>
</template>
