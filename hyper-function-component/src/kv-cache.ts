import QuickLRU from "quick-lru";

const kvCache = new QuickLRU({ maxSize: 1000 });

export default kvCache;
