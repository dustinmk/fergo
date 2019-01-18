import {Vdom} from "./vdom";
import update from "./update";

let selected_redraw = redrawAsync;

export const redraw = (vdom: Vdom) => {
    selected_redraw(vdom);
}

export const selectRedraw = (redraw_function: (vdom: Vdom) => void) => {
    selected_redraw = redraw_function;
}

// Limit redraws by queuing and requestAnimationFrame()
let double_buffered_queue: Array<Vdom[]> = [[], []];
let current_queue_id = 0;
let raf_id = 0; // 0 is only guaranteed invalid ID returned by requestAnimationFrame
export function redrawAsync(vdom: Vdom) {
    const write_queue = double_buffered_queue[current_queue_id];
    if (write_queue.indexOf(vdom) < 0) {
        write_queue.push(vdom);
    }

    if (raf_id === 0) {
        raf_id = window.requestAnimationFrame(() => {
            const read_queue = double_buffered_queue[1 - current_queue_id];
            read_queue.forEach(queued_vdom => redrawSync(queued_vdom));
            double_buffered_queue[1 - current_queue_id] = [];
            current_queue_id = 1 - current_queue_id;
            raf_id = 0;
        });
    }
};

// Synchronous redraw
export function redrawSync(vdom: Vdom) {
    // Propagate redraw() up to closest functional vnode
    if (vdom._type !== "VdomFunctional") {
        if (vdom.parent === null) {
            throw new Error("Root element must be a functional vdom");
        }
        redraw(vdom.parent);

    } else {
        const old_elem = vdom.elem;

        // Force an update, ignoring if the same instance is returned
        // Only do this at the top level of a redraw cycle
        const generated = vdom.generator(vdom);
        const elem = update(old_elem, vdom.instance, generated, vdom.bindpoint);
        vdom.instance = generated;
        generated.parent = vdom;
        
        if (elem === null) {
            throw new Error("Root vdom must always return an element");
        }

        // The parent hasn't redrawn so it is the same as before. Components must
        // return an element, so the parent element will always be there.
        if (old_elem !== elem && old_elem !== null && old_elem.parentNode !== null && elem !== null) {
            old_elem.parentNode.replaceChild(elem, old_elem);
        }
    }
}
