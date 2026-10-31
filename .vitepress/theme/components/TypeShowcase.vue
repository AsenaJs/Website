<script setup lang="ts">
import HoverCode from './HoverCode.vue'
</script>

<template>
    <section class="lp-section ts-section">
        <div class="lp-wrap">
            <div class="ts-head" data-reveal>
                <span class="lp-eyebrow">Route context contracts</span>
                <h2 class="lp-h2">Type-safe from schema to handler</h2>
                <p class="lp-lead">
                    Declare what a route accepts once. The same schema validates the request,
                    types the handler and documents the endpoint in OpenAPI.
                </p>
            </div>

            <div class="ts-rail">
                <div class="ts-item" data-reveal>
                    <div class="ts-text">
                        <h3 class="ts-title">Request validation</h3>
                        <p>
                            A contract is a context class built with <code>Context.define()</code>.
                            Body, query, params and headers are validated before the handler runs,
                            so only valid data ever reaches it.
                        </p>
                        <p>
                            Bring <b class="ts-hl">Zod or any Standard Schema library</b> — Asena
                            depends on none of them.
                        </p>
                    </div>
                    <div class="ts-stage"><HoverCode id="home-contract" /></div>
                </div>

                <div class="ts-item" data-reveal>
                    <div class="ts-text">
                        <h3 class="ts-title">Inferred, not annotated</h3>
                        <p>
                            <code>context.input</code> carries each schema's <b class="ts-hl">output type</b> —
                            defaults, coercions and transforms included. No generics, no casts, no
                            DTO class kept in sync by hand.
                        </p>
                        <p>Your getters and helpers live on the contract class and stay typed too.</p>
                    </div>
                    <div class="ts-stage"><HoverCode id="home-inferred" /></div>
                </div>

                <div class="ts-item" data-reveal>
                    <div class="ts-text">
                        <h3 class="ts-title">Undeclared input does not compile</h3>
                        <p>
                            Only the targets a contract declares exist on <code>context.input</code>.
                            Reading one it never validated is a <b class="ts-hl">compile error</b>,
                            not a runtime surprise.
                        </p>
                    </div>
                    <div class="ts-stage"><HoverCode id="home-undeclared" /></div>
                </div>
            </div>
        </div>
    </section>
</template>
