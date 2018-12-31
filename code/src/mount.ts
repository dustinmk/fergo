import {Vdom} from "./vdom";
import update from "./update";

export function mount(elem: HTMLElement, vdom: Vdom) {
    if (typeof vdom.value !== "function") {
        throw new Error("Root vdom must be functional");
    }

    update(null, vdom);

    if (vdom.elem === null) {
        throw new Error("Vdom element could not be created");
    }

    elem.appendChild(vdom.elem);
}