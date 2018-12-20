import {Vdom, VdomNode} from "./vdom";
import {redraw} from "./redraw";

export function mount(dom: HTMLElement, vdom_creator: Vdom | (() => Vdom)) {

    // Dummy root element
    const root_node: VdomNode = {
        _type: "VdomNode",
        tag: "",
        id: undefined,
        attributes: {},
        classes: [],
        children: []
    };

    const root_vdom: Vdom = {
        _type: "Vdom",
        parent: null,
        elem: dom,
        value: root_node,
        node: root_node
    };

    // Top user-defined vdom
    const vdom = typeof vdom_creator === "function"
        ?   {
                _type: "Vdom",
                parent: root_vdom,
                elem: null,
                value: vdom_creator,
                node: null    // Avoid calling vdom_creator twice: here, then in redraw()
            } as Vdom
        : Object.assign(vdom_creator, {parent: root_vdom});

    if (typeof vdom.value !== "function") {
        throw Error("Root vdom must be a function");
    }

    (root_vdom.value as VdomNode).children = [vdom];

    redraw(vdom);
}