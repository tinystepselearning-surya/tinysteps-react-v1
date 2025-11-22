// @ts-nocheck
// Optional runtime override loader for Master Curriculum v2.1
// Drop a JSON at /public/curriculum-v2.1.json with shape:
// {
//   "courses": {
//     "phonics-foundation": { "weeks": [ {"title":"Week 1 ...", "learns":[...], ...}, ... ] },
//     "grammar-essentials": { "weeks": [...] }
//   }
// }
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let cache = null;
export function loadCurriculumOverrides() {
    return __awaiter(this, void 0, void 0, function* () {
        if (cache)
            return cache;
        try {
            const res = yield fetch('/curriculum-v2.1.json', { cache: 'no-store' });
            if (!res.ok)
                return null;
            const data = yield res.json();
            cache = data;
            return data;
        }
        catch (_a) {
            return null;
        }
    });
}
export function getCourseWeeksOverride(slug) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const data = yield loadCurriculumOverrides();
        return (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.courses) === null || _a === void 0 ? void 0 : _a[slug]) === null || _b === void 0 ? void 0 : _b.weeks) !== null && _c !== void 0 ? _c : null;
    });
}
