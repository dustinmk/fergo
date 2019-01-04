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
    // Propagate redraw() up to closest functional vnode
    if (vdom._type !== "VdomFunctional") {
        if (vdom.parent === null) {
            throw new Error("Root element must be a functional vdom");
        }
        redraw(vdom.parent);

    } else {
        const old_elem = vdom.elem;

        update(vdom, vdom);

        if (vdom.elem === null) {
            throw new Error("Root vdom must always return an element");
        }

        // TODO: This might not work with nested components - consider added/removed elements
        if (vdom.elem !== old_elem && vdom.elem !== null && vdom.elem.parentNode !== null && old_elem !== null) {
            vdom.elem.parentNode.replaceChild(old_elem, vdom.elem);
        }
    }
}
