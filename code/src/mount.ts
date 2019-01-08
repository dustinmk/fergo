import {v, Vdom, VdomGenerator} from "./vdom";
import update from "./update";

export function mount(elem: HTMLElement, vdom: Vdom | VdomGenerator) {
    if (typeof vdom === "function") {
        mount(elem, v(vdom));
    }

    else if (vdom._type !== "VdomFunctional") {
        throw new Error("Root vdom must be functional");
    }

    else {
        const child = update(null, null, vdom);
        
        if (child === null) {
            throw new Error("Vdom element could not be created");
        }
    
        elem.appendChild(child);
    }
}