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
        <li>REACT</li>
        <li>VUE</li>
        <li>HFZ</li>
        <li>ANGULAR</li>
        <li>SVELTE</li>
      </ul>
    </div>
  </h1>
</template>
