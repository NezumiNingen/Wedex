export const id = (prefix = 'id') => `${prefix}_${crypto.randomUUID()}`;
export const shortPath = (path: string) => path.length > 54 ? `…${path.slice(-51)}` : path;
