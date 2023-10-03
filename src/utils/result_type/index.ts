/**
 * Custom type that sends a result value or error.
 * TODO: Maybe add map and flatMap to make transformations simper?
 * TODO: Might be a good time to switch to true-myth?
 */
export type Result<T,E> = {result: "success", value: T} | {result: "error", value: E};
