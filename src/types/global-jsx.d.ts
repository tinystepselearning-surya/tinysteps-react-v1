declare module '*.jsx' {
  const Component: any;
  export default Component;
}

declare module '*.mdx' {
  const MDXContent: any;
  export default MDXContent;
}

declare module '*components/*' {
  const Component: any;
  export default Component;
}
