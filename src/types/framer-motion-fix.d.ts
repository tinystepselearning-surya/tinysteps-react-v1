/*
  Temporary TS workaround for framer-motion v8 typing discrepancies in this repo.
  This file declares lightweight any-typed exports so we can incrementally add stricter typing later.
  Once the project is upgraded to a version of framer-motion/React types that align, remove this file and add proper interfaces.
*/
declare module 'framer-motion' {
  import * as React from 'react';
  export const motion: any;
  export const animate: any;
  export const useInView: any;
  export const useMotionValue: any;
  export const useTransform: any;
  export const useSpring: any;
  export const useScroll: any;
  export const AnimatePresence: any;
  export const HTMLMotionProps: any;
  export const MotionProps: any;
  export default motion;
}
