var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function fetchMdxPosts() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const modules = import.meta.glob('./blog/*.mdx');
            const entries = Object.entries(modules);
            const result = [];
            for (const [path, loader] of entries) {
                try {
                    const mod = yield loader();
                    const meta = mod.meta || {};
                    const slug = path.replace('./blog/', '').replace(/\.mdx?$/, '');
                    result.push(Object.assign({ slug }, meta));
                }
                catch (e) {
                    // ignore broken mdx import
                }
            }
            return result;
        }
        catch (e) {
            return [];
        }
    });
}
