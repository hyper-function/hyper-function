<script setup lang="ts">
import { useAttrs } from "vue";

const props = defineProps(["name"]);
const attrs = useAttrs();
</script>
<template>
  <h1>
    <div>THIS COMPONENT</div>
    <div>CAN BE USED IN</div>
    <div class="brand">
      <ul>
        <li>React</li>
        <li>Vue</li>
        <li>Hfz</li>
        <li>Angular</li>
        <li>WebComponents</li>
      </ul>
    </div>
  </h1>
</template>
