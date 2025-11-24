import type { FC, HTMLAttributes } from 'react';
interface CardProps extends HTMLAttributes<HTMLDivElement> {
    gradient?: boolean;
    withBorder?: boolean;
}
declare const Card: FC<CardProps>;
export default Card;
