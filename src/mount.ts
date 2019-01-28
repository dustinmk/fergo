import {v, Vdom, VdomGenerator} from "./vdom";
import {VDOM_FUNCTIONAL} from "./constants";
import update from "./update";

export const mount = (elem: HTMLElement, vdom: Vdom | VdomGenerator<any, any>)  => {
    if (typeof vdom === "function") {
        mount(elem, v(vdom));
    }

    else if (vdom === null || vdom._type !== VDOM_FUNCTIONAL) {
        throw new Error("Root vdom must be functional");
    }

    else {
        vdom.elem = update(null, vdom, vdom.bindpoint);
        
        if (vdom.elem === null) {
            throw new Error("Vdom element could not be created");
        }
    
        elem.appendChild(vdom.elem);
    }
}