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
import { useToast } from "@components/hooks/use-toast";
import { Toast } from "./toast";
export function Toaster() {
    const { toasts } = useToast();
    return (_jsx("div", { children: toasts.map(function (_a) {
            var { id, title, description, action } = _a, props = __rest(_a, ["id", "title", "description", "action"]);
            return (_jsx(Toast, Object.assign({ title: title || "", description: description || "", action: action }, props), id));
        }) }));
}
