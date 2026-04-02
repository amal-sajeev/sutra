import { getAsset } from '../db/operations';

const ASSET_SRC_PREFIX = 'sutra-asset:';

export function prepareImagesForStorage(node: unknown): unknown {
  if (node === null || typeof node !== 'object') return node;
  const o = node as Record<string, unknown>;
  if (o.type === 'image' && o.attrs && typeof o.attrs === 'object') {
    const attrs = { ...(o.attrs as Record<string, unknown>) };
    const title = typeof attrs.title === 'string' ? attrs.title : '';
    const m = /^asset:(\d+)$/.exec(title);
    if (m) {
      attrs.src = `${ASSET_SRC_PREFIX}${m[1]}`;
    }
    return { ...o, attrs };
  }
  if (Array.isArray(o.content)) {
    return { ...o, content: o.content.map((c) => prepareImagesForStorage(c)) };
  }
  return node;
}

export async function hydrateImagesFromStorage(
  node: unknown,
  createdBlobUrls?: string[],
): Promise<unknown> {
  if (node === null || typeof node !== 'object') return node;
  const o = node as Record<string, unknown>;
  if (o.type === 'image' && o.attrs && typeof o.attrs === 'object') {
    const attrs = { ...(o.attrs as Record<string, unknown>) };
    const src = typeof attrs.src === 'string' ? attrs.src : '';
    if (src.startsWith(ASSET_SRC_PREFIX)) {
      const idStr = src.slice(ASSET_SRC_PREFIX.length);
      const id = Number(idStr);
      if (Number.isFinite(id)) {
        const asset = await getAsset(id);
        if (asset?.data) {
          const url = URL.createObjectURL(asset.data);
          createdBlobUrls?.push(url);
          attrs.src = url;
        }
      }
    }
    return { ...o, attrs };
  }
  if (Array.isArray(o.content)) {
    const content = await Promise.all(
      o.content.map((c) => hydrateImagesFromStorage(c, createdBlobUrls)),
    );
    return { ...o, content };
  }
  return node;
}
