<script setup lang="ts">
import { computed, h } from 'vue'
import { DIAGRAMS } from './diagrams'

const props = defineProps<{ id: string }>()

const diagram = computed(() => DIAGRAMS[props.id])

const tagWidth = computed(() => {
    const longest = Math.max(0, ...diagram.value.sections.flatMap((s) => s.steps.map((st) => st.tag?.length ?? 0)))
    return longest > 3 ? '190px' : '22px'
})

const Rich = (p: { text: string }) =>
    p.text.split(/(`[^`]+`)/).filter(Boolean).map((t) => (t.startsWith('`') ? h('code', t.slice(1, -1)) : t))
</script>

<template>
    <figure v-if="diagram" class="dg vp-raw" :class="[`dg-${diagram.kind}`, { 'dg-wide-tags': tagWidth !== '22px' }]" :style="{ '--dg-tag-w': tagWidth }" :aria-label="diagram.title">
        <template v-for="(section, s) in diagram.sections" :key="s">
            <div v-if="s > 0" class="dg-link" aria-hidden="true"></div>
            <section class="dg-section">
                <header class="dg-label"><Rich :text="section.label" /></header>
                <ol class="dg-steps">
                    <li v-for="(step, i) in section.steps" :key="i" class="dg-step">
                        <span v-if="step.tag || diagram.kind === 'flow'" class="dg-tag">{{ step.tag }}</span>
                        <div class="dg-cells">
                            <div v-for="(cell, c) in step.cells" :key="c" class="dg-cell">
                                <div class="dg-title"><Rich :text="cell.title" /></div>
                                <p v-if="cell.detail" class="dg-detail"><Rich :text="cell.detail" /></p>
                            </div>
                        </div>
                    </li>
                </ol>
            </section>
        </template>
        <ul v-if="diagram.exits?.length" class="dg-exits">
            <li v-for="(exit, i) in diagram.exits" :key="i">
                <span class="dg-when"><Rich :text="exit.when" /></span>
                <span class="dg-arrow" aria-hidden="true">→</span>
                <span class="dg-then"><Rich :text="exit.then" /></span>
            </li>
        </ul>
        <figcaption class="dg-caption">{{ diagram.title }}</figcaption>
    </figure>
</template>
