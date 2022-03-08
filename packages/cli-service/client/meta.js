let cachedMeta;
export async function fetchMeta(noCache) {
  if (!noCache && cachedMeta) {
    return cachedMeta;
  }

  return await fetch("/meta")
    .then((res) => res.json())
    .then((meta) => {
      cachedMeta = meta;
      return cachedMeta;
    });
}
