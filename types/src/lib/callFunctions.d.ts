/**
 * Calls a Firebase callable function, preferring the region where it is actually deployed.
 * Falls back across known regions if needed. Throws the last error if all regions fail.
 */
export declare function callFunction<T = any, P = any>(name: string, payload?: P): Promise<T>;
export default callFunction;
