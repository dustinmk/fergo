import {Vdom, VdomNode} from "./vdom";
import {redraw} from "./redraw";

export default update;

// Compare old and new Vdom, then put updated elem on new_vdom
// TODO: Handle function, vdom, string, null, undefined, boolean values
// TODO: Refactor - shouldn't have to check children type twice
function update(old_vdom: Vdom | null, new_vdom: Vdom) {
    /* Cases:
        - new is function: check if result node instance is same as last, otherwise update(old, generated)
        - new is null/undefined/false: error
        - new is string: create and replace
        - new is vdom:
            - patch old&new. If old is string/null/undefined/false: create
            - patch children. map keys of old&new, then walk sequentially calling update on each pair
            - Rebind DOM elems as needed
    */




    const bound_vdom = old_vdom === null
        ? new_vdom
        : old_vdom;

    if (typeof new_vdom.value === "function") {
        new_vdom.node = new_vdom.value().node;
        // TODO: Cutoff if new vdom is the same identity as the old one
    }

    if (new_vdom.node === null) {
        throw new Error("New vdom node is null");
    }

    if (old_vdom === null || old_vdom.node === null || old_vdom.elem === null) {
        // Create new element
        if (typeof new_vdom.node === "string") {
            new_vdom.elem = createTextNode(new_vdom.node);
        } else {
            new_vdom.elem = createHTMLElement(new_vdom.node, bound_vdom);
        }

    } else {
        if (typeof new_vdom.node === "string") {
            // Create text node
            new_vdom.elem = createTextNode(new_vdom.node);

        } else {
            if (typeof old_vdom.node === "string") {
                // Replace element
                new_vdom.elem = createHTMLElement(new_vdom.node, bound_vdom);

            } else {
                // Patch or replace element
                new_vdom.elem = patchElement(old_vdom.elem, old_vdom.node, new_vdom.node, bound_vdom);
            }
        }
    }
}

function createTextNode(node: string) {
    return document.createTextNode(node);
}

function patchElement(elem: Node, old_node: VdomNode, new_node: VdomNode, bound_vdom: Vdom) {
    if (old_node.tag !== new_node.tag) {
        return createHTMLElement(new_node, bound_vdom);
    }

    // Recursively call update() on best matching children

    // patchId(elem, old_node, new_node);
    // patchClasses(elem, old_node, new_node);
    // patchAttributes(elem, old_node, new_node);
    patchChildren(elem, old_node, new_node);

    return elem;
}

// TODO: Patch these attributes

// function patchClasses(elem: HTMLElement, old_node: VdomNode, new_node: VdomNode) {
// }

// function patchId(elem: HTMLElement, old_node: VdomNode, new_node: VdomNode) {
// }

// function patchAttributes(elem: HTMLElement, old_node: VdomNode, new_node: VdomNode) {
// }

function patchChildren(elem: Node, old_node: VdomNode, new_node: VdomNode) {

    // Call update() on children
    // redraw child () => Vdom and prune if same node as last time

    // Simple algo to start
    // TODO: Use an edit distance metric
    // TODO: Use key/id/name attibute to match nodes
    // Use depth-first replace, cache elements and reuse as much as possible



    // Start from index 0 and only go up
    // Remove keyed elements from sequence and base on mapped keys instead
    // Call update() uniformly on all children
    // Allow for less or more items at end

    let new_index = 0;
    let old_index = 0;
    while (new_index < new_node.children.length || old_index < old_node.children.length) {
        const old_child_vdom = old_node.children[old_index];
        const new_child_vdom = new_node.children[new_index];

        if (new_index >= new_node.children.length) {

            // Remove old_node[old_index]
            old_child_vdom.elem !== null && elem.removeChild(old_child_vdom.elem);

            ++old_index;

        } else if (old_index >= old_node.children.length) {

            // Append new_node[new_index]
            update(null, new_child_vdom);
            new_child_vdom.elem !== null && elem.appendChild(new_child_vdom.elem);

            ++new_index;

        } else if (isSame(old_child_vdom, new_child_vdom)) {

            // Update old elem to new one
            update(old_child_vdom, new_child_vdom);

            ++new_index;
            ++old_index;

        } else {

            // Remove old and insert new
            update(null, new_child_vdom);
            new_child_vdom.elem !== null && elem.insertBefore(new_child_vdom.elem, old_child_vdom.elem);
            old_child_vdom.elem !== null && elem.removeChild(old_child_vdom.elem);
            
            ++new_index;
            ++old_index;
        }
    }
}

function isSame(old_vdom: Vdom, new_vdom: Vdom) {
    if (old_vdom.node === new_vdom.node) {
        return true;
    }

    if (
        old_vdom.node !== null 
        && typeof old_vdom.node !== "string"
        && new_vdom.node !== null
        && typeof new_vdom.node !== "string"
    ) {
        return old_vdom.node.tag === new_vdom.node.tag;
    }

    return false;
}

function createHTMLElement(node: VdomNode, vdom: Vdom) {
    if (node.tag === "") {
        throw new Error("Invlaid tag");
    }

    const elem = document.createElement(node.tag);
    setAttributeIfExists(elem, "id", node.id);
    if (node.classes.length > 0) {
        elem.className = node.classes.join(" ");
    }

    Object.keys(node.attributes).forEach(key => {
        if (node.attributes.hasOwnProperty(key)) {
            if (typeof node.attributes[key] === "function") {
                elem.addEventListener(eventName(key), (evt: Event) => {
                    node.attributes[key](evt, vdom);
                    redraw(vdom);
                });

            } else if (node.attributes[key] !== false) {
                elem.setAttribute(key, node.attributes[key]);
            }
        }
    });

    node.children.forEach(child => {
        update(null, child);
        if (child.elem !== null) {
            elem.appendChild(child.elem);
        }
    });
    
    return elem;
}

function setAttributeIfExists(elem: HTMLElement, attribute: string, value: string | undefined) {
    if (value !== undefined) {
        elem.setAttribute(attribute, value);
    }
}

function eventName(key: string) {
    const regex_result = key.match(/on([\w]+)/);
    if(regex_result === null || regex_result.length < 2) {
        throw new Error(`Invalid handler: ${key}`);
    }
    return regex_result[1];
}