declare global {
    interface Window {
        Benchmark: any;
        call_fn: () => void;
        call_setup: () => void;
        call_teardown: () => void;
    }
}

import { Vdom, mount, redraw, selectRedraw, redrawSync } from "minim";
import {Row, generateRows} from "./big-table-row";

export default (generator: (props: {rows: Row[]}) => Vdom) => 
    (name: string, mutate_rows: (rows: Row[], new_rows: Row[]) => Row[]) =>
    (root_elem: HTMLElement) =>
{
    selectRedraw(redrawSync);

    return new Promise<{
        name: string,
        time: number
    }>(resolve => {
        let new_rows: Row[] = generateRows(1000);
        const props = {rows: [] as Row[]};
        const root = generator(props);

        // Benchmarkjs decompiles the provided hooks to a string then compiles it back
        // In order to keep the closure, put the hooks on global scope so the compiled
        // functions can reach them.
        // This however defeats the purpose of decompilation in benchmark.js
        window.call_setup = () => {
            props.rows = generateRows(5000);
            new_rows = generateRows(1000);
            mount(root_elem, root);
            props.rows = mutate_rows(props.rows, new_rows)
        }

        window.call_teardown = () => {
            root_elem.childNodes.forEach(child => root_elem.removeChild(child));
        }

        window.call_fn = () => {
            redraw(root);
        }

        const benchmark = new window.Benchmark("foo", {
            setup: function() { window.call_setup() },
            fn: function() { window.call_fn() },
            teardown: function() { window.call_teardown() },
            onComplete: function() {
                resolve({
                    name,
                    time: benchmark.stats.mean
                })
            }
        });
        benchmark.run();
    });
}