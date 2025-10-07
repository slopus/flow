export function lazy<T>(func: () => Promise<T>): () => Promise<T> {
    let promise: Promise<T> | undefined;
    return async () => {
        if (!promise) {
            promise = func();
        }
        return await promise;
    };
}