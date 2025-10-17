---
layout: home

hero:
  name: "Asena"
  text: "A modern ioc web-framework for bun"
  tagline: Easy to use, fast to develop
  image:
    src: /asena-logo.svg
    alt: Asena
  actions:
    - theme: brand
      text: Get started
      link: /docs/get-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/AsenaJs/Asena

features:
  - title: ⚡ High Performance
    details: Built on Bun runtime with up to 295k req/sec. SIMD-accelerated routing and zero-copy file serving for maximum speed.

  - title: 🎯 Full IoC Container
    details: Field-based dependency injection for all components. Clean architecture with decorators for services, controllers, and middleware.

  - title: 🔌 Pluggable Adapters
    details: Choose between Ergenecore (native Bun) or Hono adapter. Switch adapters without changing your business logic.

  - title: 🌐 WebSocket Support
    details: Built-in WebSocket handling with namespace management. Create real-time applications with ease.

  - title: 🛡️ Type-Safe Validation
    details: Integrated Zod validation with automatic error handling. Request validation at route, controller, or global level.

  - title: 📦 Official Packages
    details: Logger, Drizzle ORM integration, and CLI tools. Everything you need to build production-ready applications.

---

<div class="showcase-section">
  <h2 class="showcase-title">Built with Asena</h2>
  <div class="showcase-grid">
    <a href="https://scrumpoker.me/" target="_blank" rel="noopener" class="showcase-card"><svg class="card-logo" width="180" height="42" viewBox="0 0 170 40" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="spg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3B82F6"></stop><stop offset="100%" stop-color="#4F46E5"></stop></linearGradient><linearGradient id="sp1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3B82F6"></stop><stop offset="100%" stop-color="#4F46E5"></stop></linearGradient><linearGradient id="sp2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60A5FA"></stop><stop offset="100%" stop-color="#6366F1"></stop></linearGradient></defs><circle cx="20" cy="20" r="20" fill="#EFF6FF"></circle><rect x="24" y="12" width="8" height="20" rx="2" fill="#E0E7FF" stroke="#6366F1" stroke-width="1.5" transform="rotate(15, 28, 22)"></rect><rect x="16" y="10" width="8" height="20" rx="2" fill="url(#sp2)" stroke-width="1.5" transform="rotate(0, 20, 20)"></rect><rect x="8" y="12" width="8" height="20" rx="2" fill="url(#sp1)" stroke-width="1.5" transform="rotate(-15, 12, 22)"></rect><text x="48" y="28" style="font-family:system-ui,-apple-system,sans-serif;font-weight:600;font-size:18px" fill="currentColor">Scrum</text><text x="103" y="28" style="font-family:system-ui,-apple-system,sans-serif;font-weight:600;font-size:18px" fill="url(#spg)">Poker</text></svg><p class="card-desc">Real-time planning poker for agile teams</p><div class="card-tags"><span class="ctag">REST API</span><span class="ctag">WebSocket</span><span class="ctag">Production</span></div></a><a href="https://checkcryptoaddress.com/" target="_blank" rel="noopener" class="showcase-card"><div class="crypto-brand"><svg width="40" height="40" viewBox="0 0 375 375" xmlns="http://www.w3.org/2000/svg"><path fill="#4dabf7" d="M346.895 91.305 191.62 1.754l-.023-.012a7.915 7.915 0 0 0-7.844.012L28.488 91.304a7.867 7.867 0 0 0-3.941 6.81v179.1a7.87 7.87 0 0 0 3.933 6.806l155.305 89.57a7.912 7.912 0 0 0 3.903 1.035 7.93 7.93 0 0 0 3.933-1.055l155.266-89.547a7.88 7.88 0 0 0 3.941-6.808V98.113a7.88 7.88 0 0 0-3.933-6.808Zm-11.801 110.382v70.989L187.688 357.69l-55.856-32.214Zm-286.95 75.524 286.95-165.457v71.527L116.309 316.523ZM187.657 110.77l-78.039-48.106 78.07-45.027 78.04 45.008Zm-.203 67.968L48.074 98.152 94.137 71.59l89.379 55.097c2.5 1.543 5.843 1.52 8.273.004l89.418-55.12 46.047 26.558ZM40.281 168.477v-56.668l131.446 75.996-48.926 28.21Zm66.781 56.617-66.78 38.504V186.62Zm0 0"></path></svg><span class="ctext">Check</span><span class="ctext-grad">Crypto</span></div><p class="card-desc">Crypto adress validation</p><div class="card-tags"><span class="ctag">REST API</span><span class="ctag">Migration</span><span class="ctag">Websocket</span></div></a>
  </div>
  <a href="/docs/showcase" class="view-all">View All Projects →</a>
</div>

<style>
.showcase-section {
  max-width: 1152px;
  margin: 3rem auto 4rem;
  padding: 0 1.5rem;
  text-align: center;
}

.showcase-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--vp-c-text-1);
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.showcase-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.showcase-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
}

.card-logo {
  margin-bottom: 1rem;
}

.crypto-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-family: system-ui, -apple-system, sans-serif;
  font-weight: 600;
  font-size: 1.375rem;
}

.ctext {
  color: var(--vp-c-text-1);
}

.ctext-grad {
  background: linear-gradient(135deg, #4dabf7, #339af0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-desc {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.card-tags {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.ctag {
  padding: 0.25rem 0.625rem;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.view-all {
  display: inline-block;
  padding: 0.5rem 1rem;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.view-all:hover {
  color: var(--vp-c-brand-2);
}

@media (max-width: 768px) {
  .showcase-section {
    margin: 2rem auto 3rem;
  }
  .showcase-title {
    font-size: 1.5rem;
  }
  .showcase-grid {
    grid-template-columns: 1fr;
  }
}
</style>

