export const sleep = (t = 0) => new Promise((r) => setTimeout(r, t));

export const toStringTag = (data: any) => Object.prototype.toString.call(data).slice(8, -1);
