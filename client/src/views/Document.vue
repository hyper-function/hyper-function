<template>
  <div class="my-4 md:my-8 mx-auto max-w-[1164px]">
    <div class="mx-4 md:mx-8 md:pr-[332px] relative">
      <div id="content" class="">
        <HeaderInfo
          :tabs="tabs"
          :active-tab="activeTab"
          @change="activeTab = $event.name"
        />
        <div v-show="activeTab === 'Readme'">
          <Readme />
        </div>

        <div v-if="activeTab === 'PropTypes'">
          <PropTypes />
        </div>
        <div v-if="activeTab === 'DesignTokens'">
          <CssVars />
        </div>
      </div>

      <Sidebar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import Sidebar from "../components/Sidebar.vue";
import PropTypes from "../components/PropTypes.vue";

import HeaderInfo from "../components/Header.vue";
import CssVars from "../components/CssVars.vue";
import Readme from "../components/Readme.vue";

const activeTab = ref("Readme");

const tabs = ref<{ name: string }[]>([
  { name: "Readme" },
  { name: "PropTypes" },
  { name: "DesignTokens" },
]);
</script>
