
export function invariant(condition: boolean, message: string): void | never {
    if (true) {
        if (!condition) {
            throw new Error(message);
        }
    }
}

export function exists<ValueType>(value: ValueType | null | undefined, message?: string): value is ValueType {
    if (value === null || value === undefined) {
        throw new Error(message);
    }
    return true;
}