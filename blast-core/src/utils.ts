export type RenameProperties<T, R extends { [K in keyof T]?: string }> = {
  [P in keyof T as P extends keyof R ? R[P] extends string ? R[P] : P : P]: T[P];
};

export function renameProperties<
    T extends {[key: string]: unknown}, 
    R extends { [K in keyof T]?: string },
>(
    obj: T, 
    renames: R,
): RenameProperties<T, R> {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key in renames ? renames[key] : key, value])
    ) as RenameProperties<T, R>;
}