import {v, Vdom, VdomGenerator} from "./vdom";
import update from "./update";

export const mount = (elem: HTMLElement, vdom: Vdom | VdomGenerator<any, any>)  => {
    if (typeof vdom === "function") {
        mount(elem, v(vdom));
    }

    else if (vdom._type !== "VdomFunctional") {
        throw new Error("Root vdom must be functional");
    }

    else {
        vdom.elem = update(null, null, vdom, vdom.bindpoint);
        
        if (vdom.elem === null) {
            throw new Error("Vdom element could not be created");
        }
    
        elem.appendChild(vdom.elem);
    }
}