var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@components/lib/utils";
import { cva } from "class-variance-authority";
const cardVariants = cva("rounded-xl border bg-card text-card-foreground shadow transition-transform", {
    variants: {
        variant: {
            default: "bg-card",
            outlined: "border border-muted bg-transparent",
            elevated: "shadow-lg",
            flat: "border-none bg-card",
        },
        hoverEffect: {
            true: "hover:scale-105 hover:shadow-md",
            false: "",
        },
        shadow: {
            none: "shadow-none",
            small: "shadow-sm",
            medium: "shadow",
            large: "shadow-lg",
        },
    },
    defaultVariants: {
        variant: "default",
        hoverEffect: false,
        shadow: "medium",
    },
});
const Card = React.forwardRef((_a, ref) => {
    var { className, variant, hoverEffect, shadow } = _a, props = __rest(_a, ["className", "variant", "hoverEffect", "shadow"]);
    return (_jsx("div", Object.assign({ ref: ref, className: cn(cardVariants({ variant, hoverEffect, shadow, className })) }, props)));
});
Card.displayName = "Card";
const CardHeader = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("div", Object.assign({ ref: ref, className: cn("flex flex-col space-y-1.5 p-6", className) }, props)));
});
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("div", Object.assign({ ref: ref, className: cn("font-semibold leading-none tracking-tight", className) }, props)));
});
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("div", Object.assign({ ref: ref, className: cn("text-sm text-muted-foreground", className) }, props)));
});
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("div", Object.assign({ ref: ref, className: cn("p-6 pt-0", className) }, props)));
});
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (_jsx("div", Object.assign({ ref: ref, className: cn("flex items-center p-6 pt-0", className) }, props)));
});
CardFooter.displayName = "CardFooter";
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants, };
