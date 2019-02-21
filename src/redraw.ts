import {Vdom, VdomNode} from "./vdom";
import update from "./update";
import {VDOM_FUNCTIONAL} from "./constants";

// Limit redraws by queuing and requestAnimationFrame()
let double_buffered_queue: Array<Vdom[]> = [[], []];
let current_queue_id = 0;
let raf_id = 0; // 0 is only guaranteed invalid ID returned by requestAnimationFrame
export const redrawAsync = (vdom: Vdom) => {
    const write_queue = double_buffered_queue[current_queue_id];
    if (write_queue.indexOf(vdom) < 0) {
        write_queue.push(vdom);
    }

    if (raf_id === 0) {
        raf_id = window.requestAnimationFrame(handleFrame);
    }
};

const handleFrame = () => {
    // Take old write queue
    const read_queue = double_buffered_queue[current_queue_id];

    // Swap buffers
    current_queue_id = 1 - current_queue_id;

    // Go through old write queue (now read queue)
    read_queue.forEach(queued_vdom => redrawSync(queued_vdom));

    // Set old write queue (now read queue) to empty
    double_buffered_queue[1 - current_queue_id] = [];
    raf_id = 0;
}

// Synchronous redraw
export const redrawSync = (vdom: Vdom) => {
    // Propagate redraw() up to closest functional vnode
    if (vdom === null || vdom._type !== VDOM_FUNCTIONAL) {
        if (vdom === null || vdom.parent === null) {
            throw new Error("Root element must be a functional vdom");
        }
        redrawSync(vdom.parent);

    // If the vdom is an old instance, redraw the current instance
    } else if (vdom.bindpoint.binding !== vdom) {
        redrawSync(vdom.bindpoint.binding);

    } else {
        const old_elem = vdom.elem;

        // Force an update, ignoring if the same instance is returned
        // Only do this at the top level of a redraw cycle
        const init_queue: VdomNode[] = [];
        const generated = vdom.generator(vdom);
        vdom.elem = update(vdom.instance, generated, vdom.bindpoint, init_queue);
        vdom.instance = generated;
        if (generated !== null) {
            generated.parent = vdom;
        }
        
        if (vdom.elem === null) {
            throw new Error("Root vdom must always return an element");
        }

        // The parent hasn't redrawn so it is the same as before. Components must
        // return an element, so the parent element will always be there.
        if (old_elem !== vdom.elem
            && old_elem !== null
            && old_elem.parentNode !== null
            && vdom.elem !== null
        ) {
            old_elem.parentNode.replaceChild(vdom.elem, old_elem);
        }

        init_queue.forEach(v => v.attributes.oninit !== undefined && v.attributes.oninit(v));
    }
}

let selected_redraw = redrawAsync;

export const redraw = (vdom: Vdom) => {
    selected_redraw(vdom);
}

export const selectRedraw = (redraw_function: (vdom: Vdom) => void) => {
    selected_redraw = redraw_function;
}