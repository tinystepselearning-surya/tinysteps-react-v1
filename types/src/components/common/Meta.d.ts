import type { FC } from 'react';
type MetaProps = {
    title?: string;
    description?: string;
    keywords?: string;
    canonical?: string;
    jsonLd?: Record<string, any> | Record<string, any>[];
};
declare const Meta: FC<MetaProps>;
export default Meta;
