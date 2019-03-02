import {v, Vdom, VdomGenerator, VdomNode} from "./vdom";
import {VDOM_FUNCTIONAL} from "./constants";
import update from "./update";

export const mount = (elem: HTMLElement, vdom: Vdom | VdomGenerator<any, any>)  => {
    if (typeof vdom === "function") {
        mount(elem, v(vdom));
    }

    else if (vdom === null || vdom.node_type !== VDOM_FUNCTIONAL) {
        throw new Error("Root vdom must be functional");
    }

    else {
        const init_queue: VdomNode[] = [];
        vdom.elem = update(null, vdom, vdom, init_queue);
        
        if (vdom.elem === null) {
            throw new Error("Vdom element could not be created");
        }
    
        elem.appendChild(vdom.elem);

        init_queue.forEach(v => v.attributes.oninit !== undefined && v.attributes.oninit(v));
    }
}