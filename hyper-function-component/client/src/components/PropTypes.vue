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
          <span :style="{ paddingLeft: item.level + 'em' }">
            {{ item.name }}
          </span>
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
          <span :style="{ paddingLeft: item.level + 'em' }">
            {{ item.name }}
          </span>
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
          <span :style="{ paddingLeft: item.level + 'em' }">
            {{ item.name }}
          </span>
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
