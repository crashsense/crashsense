import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'CrashSense',
  description: 'Intelligent crash diagnosis for JavaScript, React & Vue — root cause classification, not just stack traces.',
  base: '/crashsense/',
  
  head: [
    ['meta', { name: 'theme-color', content: '#cb0000' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'CrashSense — Crash Diagnosis SDK' }],
    ['meta', { property: 'og:description', content: 'Error monitoring tells you WHAT crashed. CrashSense tells you WHY — and how to fix it.' }],
    ['meta', { property: 'og:url', content: 'https://crashsense.dev' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  themeConfig: {
    logo: undefined,
    siteTitle: 'CrashSense',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick Start', link: '/introduction/quick-start' },
      { text: 'Guide', link: '/guide/plugins' },
      { text: 'API', link: '/api/configuration' },
      {
        text: 'v1.0.7',
        items: [
          { text: 'Changelog', link: '/introduction/changelog' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@crashsense/core' },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is CrashSense?', link: '/introduction/what-is-crashsense' },
          { text: 'Quick Start', link: '/introduction/quick-start' },
          { text: 'Changelog', link: '/introduction/changelog' },
        ],
      },
      {
        text: 'Guide',
        items: [
          { text: 'Plugins', link: '/guide/plugins' },
          { text: 'Pre-Crash Warnings', link: '/guide/pre-crash-warnings' },
          { text: 'Iframe Tracking', link: '/guide/iframe-tracking' },
          { text: 'Backend Integration', link: '/guide/backend-integration' },
          { text: 'E-Commerce Example', link: '/guide/ecommerce-example' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Configuration', link: '/api/configuration' },
          { text: 'Core API', link: '/api/core' },
          { text: 'React API', link: '/api/react' },
          { text: 'Vue API', link: '/api/vue' },
          { text: 'AI API', link: '/api/ai' },
        ],
      },
      {
        text: 'Policy',
        items: [
          { text: 'Privacy Policy', link: '/policy/privacy' },
          { text: 'Security Policy', link: '/policy/security' },
          { text: 'License', link: '/policy/license' },
          { text: 'Contributing', link: '/policy/contributing' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/crashsense/crashsense' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@crashsense/core' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present CrashSense',
    },

    editLink: {
      pattern: 'https://github.com/crashsense/crashsense/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },
  },
})
