import * as TJS from "typescript-json-schema";
import * as desm from "desm";

const hfcDTS = desm.join(import.meta.url, "..", "definition", "index.d.ts");

export default function parse(location: string) {
  const compilerOptions: TJS.CompilerOptions = {
    lib: ["ES5", "dom"],
    noResolve: true,
    typeRoots: [],
    types: [],
  };

  const program = TJS.getProgramFromFiles([location, hfcDTS], compilerOptions);

  const schema: any = TJS.generateSchema(program, "HfcPropType");
  if (!schema) {
    throw new Error("parse hfc.d.ts fail");
  }

  const typeToId: Record<string, string> = {};
  let typeId = 0;

  Object.keys(schema.definitions || {}).forEach((key) => {
    if (
      ["HfcString", "HfcBoolean", "HfcInt", "HfcFloat", "HfcAny"].includes(key)
    ) {
      delete schema.definitions[key];
      return;
    }

    if (!schema.definitions[key].properties) {
      throw new Error(`[hfc.d.ts] ${key} can not be empty`);
    }

    typeToId[key] = "^" + ++typeId;
  });

  function getScalarType(v: any) {
    switch (v.$ref) {
      case "#/definitions/HfcString":
        return "#s";
      case "#/definitions/HfcBoolean":
        return "#b";
      case "#/definitions/HfcInt":
        return "#i";
      case "#/definitions/HfcFloat":
        return "#f";
      case "#/definitions/HfcAny":
        return "#a";

      default:
        break;
    }
  }

  function transform(obj: Record<string, any>, min?: boolean) {
    const ret: any = {};
    for (let [k, v] of Object.entries(obj)) {
      ret[k] = {};
      if (v.type === "array") {
        ret[k].arr = 1;
        v = v.items;
      }

      if (v.description && !min) ret[k].desc = v.description;
      if (typeof v.default !== "undefined" && !min) ret[k].default = v.default;

      if (Array.isArray(v.type) || v.anyOf) {
        throw new Error(`[hfc.d.ts] union type is not support: ${k}`);
      }

      const scalarType = getScalarType(v);
      if (scalarType) {
        ret[k].t = scalarType;
        continue;
      }

      if (v.type === "object") {
        if (v.properties && Object.keys(v.properties).length) {
          ret[k].t = transform(v.properties, min);
        } else {
          if (!min) console.warn(`[hfc.d.ts] ${k} is an empty object`);
          delete ret[k];
        }
        continue;
      }

      if (v.$ref) {
        const commonType = v.$ref.replace("#/definitions/", "");
        if (schema.definitions[commonType]) {
          ret[k].t = min ? typeToId[commonType] : commonType;
          continue;
        }
      }

      throw new Error(
        `[hfc.d.ts] unkonw type ${
          v.type || v.$ref.replace("#/definitions/", "")
        }`
      );
    }
    return ret;
  }

  const result: any = {
    attrs: {},
    events: {},
    slots: {},
    desc: {
      events: {},
      slots: {},
    },
  };
  const minResult: any = {
    attrs: {},
    events: {},
    slots: {},
  };

  if (schema.properties.attrs) {
    result.attrs = transform(schema.properties.attrs.properties);
    minResult.attrs = transform(schema.properties.attrs.properties, true);
  }

  if (schema.properties.events) {
    const eventsProps = schema.properties.events.properties;
    Object.keys(eventsProps).forEach((key) => {
      const props = eventsProps[key].properties;
      if (!props) {
        throw new Error(`[hfc.d.ts] event ${key} param must be object`);
      }
      result.events[key] = transform(props);
      const desc = eventsProps[key].description;
      if (desc) result.desc.events[key] = desc;
      minResult.events[key] = transform(props, true);
    });
  }

  if (schema.properties.slots) {
    const slotsProps = schema.properties.slots.properties;
    Object.keys(slotsProps).forEach((key) => {
      const props = slotsProps[key].properties;
      if (!props) {
        throw new Error(`[hfc.d.ts] slot ${key} param must be object`);
      }
      result.slots[key] = transform(props);
      const desc = slotsProps[key].description;
      if (desc) result.desc.slots[key] = desc;
      minResult.slots[key] = transform(props, true);
    });
  }

  if (schema.definitions) {
    result.types = transform(schema.definitions);
    minResult._t = transform(schema.definitions, true);
    Object.keys(minResult._t).forEach((key) => {
      minResult._t[typeToId[key]] = minResult._t[key];
      delete minResult._t[key];
    });
  }

  return { result, minResult };
}
