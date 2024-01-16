// https://github.com/tc39/proposal-object-pick-or-omit

export const pick = <T extends object, U extends keyof T>(obj: T, keys: U[]) =>
    Object.fromEntries(
        //@ts-ignore
        keys.map((k) => obj.hasOwnProperty(k) && [k, obj[k]]).filter((x) => x)
    ) as Pick<T, U>;

export const omit = <T extends object, U extends keyof T>(obj: T, keys: U[]) =>
    Object.fromEntries(
        //@ts-ignore
        keys.map((k) => !obj.hasOwnProperty(k) && [k, obj[k]]).filter((x) => x)
    ) as Omit<T, U>;
