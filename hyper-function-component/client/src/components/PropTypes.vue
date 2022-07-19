<template>
  <div class="prop-types-title">Attrs</div>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Description</th>
        <th>Type</th>
        <th>Default</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in attrs">
        <td
          :style="{ cursor: item.isObject ? 'pointer' : '' }"
          @click="renderSubType(attrs, item, index)"
        >
          <span :style="{ paddingLeft: item.level + 'em' }">{{
            item.name
          }}</span>
        </td>
        <td>{{ item.desc }}</td>
        <td
          :style="{ cursor: item.isObject ? 'pointer' : '' }"
          @click="renderSubType(attrs, item, index)"
        >
          {{ item.type }}
        </td>
        <td>{{ item.default }}</td>
      </tr>
    </tbody>
  </table>

  <div class="prop-types-title">Events</div>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Description</th>
        <th>Type</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in events">
        <td
          :style="{ cursor: item.isObject ? 'pointer' : '' }"
          @click="renderSubType(events, item, index)"
        >
          <span :style="{ paddingLeft: item.level + 'em' }">{{
            item.name
          }}</span>
        </td>
        <td>{{ item.desc }}</td>
        <td
          :style="{ cursor: item.isObject ? 'pointer' : '' }"
          @click="renderSubType(events, item, index)"
        >
          {{ item.type }}
        </td>
      </tr>
    </tbody>
  </table>
  <div class="prop-types-title">Slots</div>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Description</th>
        <th>Type</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in slots">
        <td
          :style="{ cursor: item.isObject ? 'pointer' : '' }"
          @click="renderSubType(slots, item, index)"
        >
          <span :style="{ paddingLeft: item.level + 'em' }">{{
            item.name
          }}</span>
        </td>
        <td>{{ item.desc }}</td>
        <td
          :style="{ cursor: item.isObject ? 'pointer' : '' }"
          @click="renderSubType(slots, item, index)"
        >
          {{ item.type }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { inject, ref, watch } from "vue";

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

async function parsePropTypes() {
  const types = propTypes.value;
  attrs.value = packTypes(types.attrs, 0, types.types);

  events.value = Object.keys(types.events).map((name) => {
    const event = types.events[name];
    return {
      name,
      desc: types.desc.events[name] || "",
      t: event,
      type: `Function (${Object.keys(event).length})`,
      types: types.types,
      isObject: true,
      level: 0,
    };
  });

  slots.value = Object.keys(types.slots).map((name) => {
    const slot = types.slots[name];
    return {
      name,
      desc: types.desc.slots[name] || "",
      t: slot,
      type: `Slot (${Object.keys(slot).length})`,
      types: types.types,
      isObject: true,
      level: 0,
    };
  });
}

function renderSubType(arr: RowItem[], item: RowItem, index: number) {
  if (!item.isObject) return;
  if (item.expanded) return;

  let items: any[] = [];
  if (
    item.type!.startsWith("Object") ||
    item.type!.startsWith("Function") ||
    item.type!.startsWith("Slot")
  ) {
    items = packTypes(item.t, item.level! + 1, item.types);
  } else {
    const type = item.types[item.t!];
    items = packTypes(type.t, item.level! + 1, item.types);
  }

  if (items.length) {
    arr.splice(index + 1, 0, ...items);
  }

  item.expanded = true;
}

function packTypes(obj: any, level: number, types: any) {
  return Object.keys(obj).map((name) => {
    const item = obj[name];

    if (typeof item.t === "string") {
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
          )[item.t] + (item.arr ? "[]" : "");
      } else {
        item.isObject = true;
        const type = types[item.t];
        item.type = `${item.t}${item.arr ? "[]" : ""} (${
          Object.keys(type.t).length
        })`;
      }
    } else {
      item.isObject = true;
      item.type = `Object${item.arr ? "[]" : ""} (${
        Object.keys(item.t).length
      })`;
    }

    item.types = types;
    item.level = level || 0;
    item.name = name;
    return item;
  });
}
</script>
