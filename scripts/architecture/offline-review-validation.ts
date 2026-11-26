// Shared ordinary DTO primitives for the integrated offline review only.
// Preserve caller-specific denial codes; no normalization or implicit defaults.
export type ReviewRow=Record<string,unknown>;
export function reviewRow(v:unknown,required:readonly string[],optional:readonly string[]=[]):ReviewRow|null{
  if(v===null||typeof v!=='object'||Array.isArray(v))return null;
  const p=Object.getPrototypeOf(v);if(p!==Object.prototype&&p!==null)return null;
  const keys=Reflect.ownKeys(v);
  if(keys.length>required.length+optional.length)return null;
  const out:ReviewRow=Object.create(null);
  for(const k of keys){
    if(typeof k!=='string'||(!required.includes(k)&&!optional.includes(k)))return null;
    const d=Object.getOwnPropertyDescriptor(v,k);
    if(!d||!d.enumerable||!Object.hasOwn(d,'value'))return null;
    out[k]=d.value;
  }
  for(const k of required)if(!Object.hasOwn(out,k))return null;
  return out;
}
export function isReviewId(v:unknown):v is string{
  return typeof v==='string'&&v.trim()===v&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v);
}
export function isReviewInteger(v:unknown,min:number,max=Number.MAX_SAFE_INTEGER):v is number{
  return typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
}
export const REVIEW_MIN_TIME=-62135596800000;
export const REVIEW_MAX_TIME=253402300799999;
