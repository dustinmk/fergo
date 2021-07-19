export const hasOwnProperty = (o: Object, k: string | number) => {
    return Object.prototype.hasOwnProperty.call(o, k);
}