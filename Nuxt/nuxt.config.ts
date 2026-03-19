// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Ashraf Beshtawi — Portfolio',
      meta: [
        { name: 'description', content: 'Explore Ashraf Beshtawi\'s interactive 3D portfolio — walk through a procedural city and discover projects in AI, Web3, Frontend, and Mobile development.' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },
  modules: [
      '@tresjs/nuxt',
      '@nuxt/ui',
      (_options, nuxt) => {
        nuxt.hooks.hook('vite:extendConfig', (config) => {
          // @ts-expect-error
          config.plugins.push(vuetify({ autoImport: true }))
        })
      },
  ],
  css: ['~/assets/css/main.css'],
  build: {
    transpile: ['vuetify'],
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
})