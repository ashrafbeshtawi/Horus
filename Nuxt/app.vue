<template>
  <div>
    <NuxtLink to="/">
      <UButton color="sky" variant="solid">Main</UButton>
    </NuxtLink>
    <NuxtLink to="/projects">
      <UButton color="sky" variant="solid">Projects</UButton>
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