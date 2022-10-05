<template>
  <div>
    <div class="text-xl font-semibold py-2">Attrs</div>
    <table
      class="table-fixed w-full text-sm text-left text-gray-500 dark:text-gray-400"
    >
      <thead
        class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
      >
        <tr>
          <th scope="col" class="py-3 pl-6 w-1/5" style="width: 20%">Name</th>
          <th scope="col" class="py-3 pl-6 w-2/5">Description</th>
          <th scope="col" class="py-3 pl-6 w-1/5" style="width: 20%">Type</th>
          <th scope="col" class="py-3 pl-6 w-1/5" style="width: 20%">
            Default
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in attrs"
          class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <td
            class="py-2 pl-6 font-semibold font-mono break-all"
            :style="{ cursor: item.isObject ? 'pointer' : '' }"
            @click="renderSubType(attrs, item, index)"
          >
            <span class="text-gray-200">
              {{ "·".repeat((item.level || 0) * 2) }}
            </span>
            <span>{{ item.name }}</span>
          </td>
          <td class="py-2 pl-6 break-words">{{ item.desc }}</td>
          <td
            class="py-2 pl-6 break-words"
            :style="{ cursor: item.isObject ? 'pointer' : '' }"
            @click="renderSubType(attrs, item, index)"
          >
            {{ item.type }}
          </td>
          <td class="py-2 pl-6 break-words">{{ item.default }}</td>
        </tr>
      </tbody>
    </table>

    <div class="text-xl font-semibold py-2 pt-10">Events</div>
    <table
      class="table-fixed w-full text-sm text-left text-gray-500 dark:text-gray-400"
    >
      <thead
        class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
      >
        <tr>
          <th scope="col" class="py-3 pl-6 w-1/5">Name</th>
          <th scope="col" class="py-3 pl-6 w-3/5">Description</th>
          <th scope="col" class="py-3 pl-6 w-1/5">Type</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in events"
          class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <td
            class="py-2 pl-6 font-semibold font-mono"
            :style="{ cursor: item.isObject ? 'pointer' : '' }"
            @click="renderSubType(events, item, index)"
          >
            <span class="text-gray-200">
              {{ "·".repeat((item.level || 0) * 2) }}
            </span>
            <span>{{ item.name }}</span>
          </td>
          <td class="py-2 pl-6">{{ item.desc }}</td>
          <td
            class="py-2 pl-6"
            :style="{ cursor: item.isObject ? 'pointer' : '' }"
            @click="renderSubType(events, item, index)"
          >
            {{ item.type }}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="text-xl font-semibold py-2 pt-10">Slots</div>
    <table
      class="table-fixed w-full text-sm text-left text-gray-500 dark:text-gray-400"
    >
      <thead
        class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
      >
        <tr>
          <th scope="col" class="py-3 pl-6 w-1/5">Name</th>
          <th scope="col" class="py-3 pl-6 w-3/5">Description</th>
          <th scope="col" class="py-3 pl-6 w-1/5">Type</th>
        </tr>
      </thead>
      <tbody
        class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
      >
        <tr
          v-for="(item, index) in slots"
          class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <td
            class="py-2 pl-6 font-semibold font-mono"
            :style="{ cursor: item.isObject ? 'pointer' : '' }"
            @click="renderSubType(slots, item, index)"
          >
            <span class="text-gray-200">
              {{ "·".repeat((item.level || 0) * 2) }}
            </span>
            <span>{{ item.name }}</span>
          </td>
          <td class="py-2 pl-6">{{ item.desc }}</td>
          <td
            class="py-2 pl-6"
            :style="{ cursor: item.isObject ? 'pointer' : '' }"
            @click="renderSubType(slots, item, index)"
          >
            {{ item.type }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watch, onMounted } from "vue";

type RowItem = Partial<{
  name: string;
  desc: string;
  t: string;
  type: string;
  types: any;
  isObject: boolean;
  level: number;
  default: string;
  expanded: boolean;
}>;

const attrs = ref<RowItem[]>([]);
const events = ref<RowItem[]>([]);
const slots = ref<RowItem[]>([]);

const propTypes = inject<any>("propTypes")!;
watch(propTypes, () => {
  parsePropTypes();
});

onMounted(() => {
  parsePropTypes();
});

let TYPES: Record<string, any> = {};

async function parsePropTypes() {
  TYPES = propTypes.value;
  attrs.value = packTypes(TYPES.Attrs, 0);

  events.value = Object.keys(TYPES.Events).map((name) => {
    const event = TYPES.Events[name];
    return {
      name,
      desc: event.c || "",
      t: event.t,
      type: `Function (${Object.keys(event.t).length})`,
      isObject: true,
      level: 0,
    };
  });

  slots.value = Object.keys(TYPES.Slots).map((name) => {
    const slot = TYPES.Slots[name];
    let t = slot.t;
    let typeName = "Slot";
    if (typeof t === "string") {
      typeName = t;
      t = TYPES[t];
    }

    return {
      name,
      desc: slot.c || "",
      t,
      type: `${typeName} (${Object.keys(t || {}).length})`,
      isObject: true,
      level: 0,
    };
  });
}

function renderSubType(arr: RowItem[], item: RowItem, index: number) {
  if (!item.isObject) return;
  if (item.expanded) return;

  let items: any[] = packTypes(item.t, item.level! + 1);

  if (items.length) {
    arr.splice(index + 1, 0, ...items);
  }

  item.expanded = true;
}

function packTypes(obj: any, level: number) {
  return Object.keys(obj).map((name) => {
    const item = obj[name];

    if (!item.t) {
      item.type = "Unknow Type";
    } else if (typeof item.t === "string") {
      if (item.t[0] === "#") {
        item.type =
          (
            {
              "#s": "String",
              "#i": "Int",
              "#f": "Float",
              "#b": "Boolean",
              "#a": "Any",
            } as Record<string, string>
          )[item.t] + (item.a ? "[]" : "");
      } else {
        const type = TYPES[item.t];
        if (type) {
          item.isObject = true;
          item.type = `${item.t}${item.a ? "[]" : ""} (${
            Object.keys(type).length
          })`;
          item.t = type;
        } else {
          item.type = "Unknow Type";
        }
      }
    } else {
      item.isObject = true;
      item.type = `Object${item.a ? "[]" : ""} (${Object.keys(item.t).length})`;
    }

    item.desc = item.c || "";
    item.level = level || 0;
    item.name = name;
    return item;
  });
}
</script>
