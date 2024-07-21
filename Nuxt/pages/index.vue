<template>
  <section class="w-full h-screen relative">
    <TresCanvas class="w-full h-screen bg-transparent">
      <TresMesh ref="boxRef" cast-shadow>
        <TresBoxGeometry  />
        <TresMeshNormalMaterial />
      </TresMesh>
    </TresCanvas>
  </section>
</template>

<style scoped>
</style>
<script setup>
import { shallowRef } from 'vue'
import { useRenderLoop } from '@tresjs/core'

const { onLoop } = useRenderLoop()

const position = { x: 0, y: 0, z: 0 }
const boxRef = shallowRef(null)

onLoop(({ elapsed, delta }) => {
  if (boxRef.value) {
    boxRef.value.rotation.y += delta
    boxRef.value.rotation.z = elapsed * 0.2  }
})
</script>

<script>
export default {

};
</script>
