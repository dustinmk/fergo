
import { Vdom, mount, redraw, selectRedraw, redrawSync } from "minim";
import {Row, generateRows} from "./big-table-row";

export default (generator: (props: {rows: Row[]}) => Vdom) => 
    (name: string, mutate_rows: (rows: Row[], new_rows: Row[]) => Row[]) =>
    async (root_elem: HTMLElement) =>
{
    selectRedraw(redrawSync);

    const new_rows = generateRows(1000);
    const original_rows = generateRows(5000);
    const props = {rows: original_rows};
    const root = generator(props);
    mount(root_elem, root);

    const call_setup = () => {
        props.rows = mutate_rows([...original_rows], [...new_rows])
    }

    const call_teardown = () => {
    }

    const call_fn = () => {
        redraw(root);
    }

    const start_time = performance.now();
    const min_time = 3 * 1000;
    const min_iter = 10;
    let iter = 0;
    await new Promise(resolve => {
        const single_iteration = () => {

            call_setup();
            performance.mark("timer-start");
            call_fn();
            performance.mark("timer-end");
            call_teardown();

            performance.measure("timer", "timer-start", "timer-end");
            
            ++iter;
            if (iter < min_iter || performance.now() - start_time < min_time) {
                setTimeout(single_iteration);
            } else {
                resolve();
            }
        }
        single_iteration();
    });

    root_elem.remove();

    const times = performance.getEntriesByName("timer").map(entry => entry.duration);
    const mean = times.reduce((acc, time) => acc += time, 0) / times.length;

    return {
        name: name,
        time: mean
    }
}