import {DEBUG} from "./constants";

export function invariant(condition: boolean, message: string): void | never {
    if (DEBUG) {
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