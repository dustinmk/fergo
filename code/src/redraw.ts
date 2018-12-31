import {Vdom} from "./vdom";
import update from "./update";

// Limit redraws by queuing and requestAnimationFrame()
let double_buffered_queue: Array<Vdom[]> = [[], []];
let current_queue_id = 0;
let raf_id: number = 0;
export function perfRedraw(vdom: Vdom) {
    const write_queue = double_buffered_queue[current_queue_id];
    const read_queue = double_buffered_queue[1 - current_queue_id];
    if (write_queue.indexOf(vdom) < 0) {
        write_queue.push(vdom);
    }

    if (raf_id === 0) {
        raf_id = window.requestAnimationFrame(() => {
            read_queue.forEach(queued_vdom => redraw(queued_vdom));
            double_buffered_queue[1 - current_queue_id] = [];
            current_queue_id = 1 - current_queue_id;
            raf_id = 0;
        });
    }
};

// Actual redraw
export function redraw(vdom: Vdom) {
    if (vdom.elem === null) {
        throw new Error("Redraw must be called on already instantiated nodes");
    }

    // Propagate redraw() up to closest functional vnode
    if (typeof vdom.value !== "function") {
        if (vdom.parent === null) {
            throw new Error("Root element must be a functional vdom");
        }
        redraw(vdom.parent);

    } else {
        // Generate new sub tree
        const new_vdom = vdom.value();

        // Compare old tree with new tree and update DOM elements accordingly
        // The resulting root element is in new_vdom. It might be the same
        // instance as the last one.
        update(vdom, new_vdom);

        if (new_vdom.elem === null) {
            throw new Error("Root vdom must always return an element");
        }

        // Redraw is only called on already mounted trees, so just replace the
        // old DOM element with the new one, if it was replaced
        vdom.node = new_vdom.node;
        if (vdom.elem !== new_vdom.elem && vdom.elem.parentNode !== null) {
            vdom.elem.parentNode.replaceChild(vdom.elem, new_vdom.elem);
        }
    }
}
