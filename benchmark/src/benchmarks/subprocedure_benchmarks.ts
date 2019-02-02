import snippetBenchmark from "../templates/snippet-benchmark";
import {Benchmark} from "../benchmark-data";

const shouldUpdate = (old_props: any, new_props: any) => {
    if (typeof new_props !== typeof old_props) {
        return true;
    }

    if (new_props !== null && typeof new_props === "object") {
        for (const key in old_props) {
            if (Object.hasOwnProperty.call(old_props, key)
                && old_props[key] !== new_props[key]
            ) {
                return true;
            }
        }
    } else {
        return old_props !== new_props;
    }

    return false;
}

const shouldUpdateAssume = (old_props: {[index: string]: any}, new_props: {[index: string]: any}) => {

    for (const key in old_props) {
        if (Object.hasOwnProperty.call(old_props, key)
            && old_props[key] !== new_props[key]
        ) {
            return true;
        }
    }


    return false;
}

const voidFunc = () => {}

const old_props = {v0: 1, v1: 2, v2: 3};
const new_props1 = {v0: 1, v1: 2, v2: 3};
const new_props2 = {v0: 1, v1: 2, v3: 3};
const new_props3 = {v0: 1, v3: 3, v4: 4};
let i = 0;

const sumv0to2 = (obj: any) => {
    return obj.v0 + obj.v1 === undefined ? 0 : obj.v1 + obj.v2 === undefined ? 0 : obj.v2
}

export default {
    "should_update_same": snippetBenchmark("shouldUpdate: same", () => shouldUpdate(i++ % 2 === 0 ? old_props : 7, i % 5 === 0 ? new_props1 : 8)),
    "should_update_different": snippetBenchmark("shouldUpdate: different", () => shouldUpdate(old_props, new_props2)),
    "should_update_assume": snippetBenchmark("shouldUpdate: assume object", () => shouldUpdateAssume(old_props, new_props2)),
    "void_func": snippetBenchmark("void func", () => voidFunc()),
    "monomorphic": snippetBenchmark("monomorphic", () => sumv0to2(i++ % 2 === 0 ? (i % 3 === 0 ? old_props : old_props) : old_props )),
    "polymorhpic": snippetBenchmark("polymorhpic", () => sumv0to2(i++ % 2 === 0 ? (i % 3 === 0 ? old_props : new_props3) : new_props2 ))
} as {[index: string]: Benchmark}