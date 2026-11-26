import {types} from 'node:util';
// Shared ordinary DTO primitives for the integrated offline review only.
// Preserve caller-specific denial codes; no normalization or implicit defaults.
export type ReviewRow=Record<string,unknown>;
export function reviewRow(v:unknown,required:readonly string[],optional:readonly string[]=[]):ReviewRow|null{
  if(v===null||typeof v!=='object'||types.isProxy(v)||Array.isArray(v))return null;
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

// Bound and detach JSON-like fixture trees before evaluating them. No aliases,
// accessors, proxies, custom prototypes, sparse arrays, or unsafe numbers.
export function copyReviewFixture(value:unknown):unknown{
  let nodes=0,chars=0;
  const seen=new WeakSet<object>();
  function visit(v:unknown,depth:number):unknown{
    if(++nodes>512||depth>12)throw Error('fixture bound');
    if(v===null||typeof v==='boolean')return v;
    if(typeof v==='string'){chars+=v.length;if(v.length>512||chars>32768)throw Error('fixture string bound');return v;}
    if(typeof v==='number'&&Number.isSafeInteger(v))return v;
    if(typeof v!=='object'||types.isProxy(v)||seen.has(v))throw Error('invalid fixture');
    seen.add(v);
    if(Array.isArray(v)){
      if(Object.getPrototypeOf(v)!==Array.prototype||v.length>100||Reflect.ownKeys(v).length!==v.length+1)throw Error('invalid array');
      const out:unknown[]=[];
      for(let i=0;i<v.length;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!d.enumerable||!Object.hasOwn(d,'value'))throw Error('invalid element');out.push(visit(d.value,depth+1));}
      return Object.freeze(out);
    }
    const proto=Object.getPrototypeOf(v);if(proto!==null&&proto!==Object.prototype)throw Error('invalid fixture prototype');
    const keys=Reflect.ownKeys(v);if(keys.length>32)throw Error('fixture field bound');
    const result:ReviewRow=Object.create(null);
    for(const k of keys){
      if(!isReviewId(k)||k.length>64)throw Error('invalid fixture key');
      const d=Object.getOwnPropertyDescriptor(v,k);
      if(!d||!d.enumerable||!Object.hasOwn(d,'value'))throw Error('invalid fixture descriptor');
      result[k]=visit(d.value,depth+1);
    }
    return Object.freeze(result);
  }
  return visit(value,0);
}
