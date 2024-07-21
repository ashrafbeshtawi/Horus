<template>
  <div>
    <NuxtLink to="/" class="w-12 h-10 rounded-lg bg-white items-center justify-center flex font-bold shadow-md">
      <div>
        Main
      </div>
    </NuxtLink>
    <NuxtLink to="/projects" class="w-12 h-10 rounded-lg bg-white items-center justify-center flex font-bold shadow-md">
      <div>
        Projects
      </div>
    </NuxtLink>

    <NuxtLayout>
      <v-app>
        <NuxtPage/>
      </v-app>
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
</script>