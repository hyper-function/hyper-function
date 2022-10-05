<template>
  <div>
    <div class="text-xl font-semibold py-2">Css Variables</div>
    <table
      class="table-fixed w-full text-sm text-left text-gray-500 dark:text-gray-400"
    >
      <thead
        class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
      >
        <tr>
          <th scope="col" class="py-3 pl-6 w-3/12">Name</th>
          <th scope="col" class="py-3 pl-6 w-3/12">Default</th>
          <th scope="col" class="py-3 pl-6">Description</th>
        </tr>
      </thead>
      <tbody
        class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
      >
        <tr
          v-for="(item, index) in cssVars"
          :key="item.name"
          class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <td class="py-2 pl-6 font-semibold font-mono">
            {{ item.name }}
          </td>
          <td class="py-2 pl-6">{{ item.value }}</td>
          <td class="py-2 pl-6">
            {{ item.comment }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts" setup>
import { inject } from "vue";

const cssVars =
  inject<{ name: string; value: string; comment?: string }[]>("cssVars");
</script>
