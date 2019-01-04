import {Vdom, VdomNode, VdomFunctional} from "./vdom";
import {redraw} from "./redraw";

export default update;

// Compare old and new Vdom, then put updated elem on new_vdom
// TODO: Support child arrays
function update(old_vdom: Vdom | null, new_vdom: Vdom) {
    if (new_vdom._type === "VdomFunctional") {
        updateFunctionalVdom(old_vdom, new_vdom);
    }

    else if (new_vdom._type === "VdomText") {
        if (old_vdom !== null && old_vdom._type === "VdomText" && new_vdom.text === old_vdom.text) {
            new_vdom.elem = old_vdom.elem;
        } else {
            new_vdom.elem = createTextNode(new_vdom.text);
        }
    }

    else if (new_vdom._type === "VdomNode") {
        if (
            old_vdom === null 
            || old_vdom.elem === null 
            || old_vdom._type === "VdomNull" 
            || old_vdom._type === "VdomText" 
            || (old_vdom._type === "VdomNode" && old_vdom.tag !== new_vdom.tag)
        ) {
            new_vdom.elem = createHTMLElement(new_vdom, new_vdom);

        } else if (old_vdom._type === "VdomFunctional") {
            update(old_vdom.instance, new_vdom);

        } else {
            new_vdom.elem = patchVdom(old_vdom, new_vdom);
        }
    }
}

function updateFunctionalVdom(old_vdom: Vdom | null, new_vdom: VdomFunctional) {
    const generated = new_vdom.generator(new_vdom);
    if (new_vdom.instance !== generated) {
        update(
            old_vdom !== null && old_vdom._type === "VdomFunctional"
                ? old_vdom.instance
                : old_vdom,
            generated
        );
        new_vdom.instance = generated;
        generated.parent = new_vdom;
        new_vdom.elem = generated.elem;
    }
}

function createTextNode(node: string) {
    return document.createTextNode(node);
}

function patchVdom(old_vdom: VdomNode, new_vdom: VdomNode) {
    if(old_vdom.elem === null) {
        throw new Error("Old vdom in invalid state. This should not be reachable.");
    }

    // TODO: Patch attributes, ID, classes, event handlers

    // Map keys
    const old_keys: {[index: string]: Vdom} = {};
    for (const old_child of old_vdom.children) {
        if (isVdomNode(old_child) && old_child.attributes.key !== undefined) {
            old_keys[old_child.attributes.key] = old_child;
        }
    }

    // Update children
    let old_index = 0;
    let new_index = 0;
    while (old_index < old_vdom.children.length || new_index < new_vdom.children.length) {
        const old_child = old_vdom.children[old_index];
        const new_child = new_vdom.children[new_index];

        // Do these first to prevent performance problems when accessing past end of array

        // Append
        if (old_index >= old_vdom.children.length) {
            update(null, new_child);
            new_child.elem !== null && old_vdom.elem.appendChild(new_child.elem);
            ++new_index;

        // Remove at end
        } else if (new_index >= new_vdom.children.length) {
            old_child.elem !== null && old_vdom.elem.removeChild(old_child.elem);
            ++old_index;

        // Skip over old nodes if they were already mapped by key
        } else if (isVdomNode(old_child) && old_child.attributes.key !== undefined) {
            ++old_index;

        // Lookup if already keyed, otherwise create new
        } else if (isVdomNode(new_child) && new_child.attributes.key !== undefined) {
            const old_mapped_child = old_keys[new_child.attributes.key];

            if (new_child.attributes.key in old_keys) {
                update(old_mapped_child, new_child);
            } else {
                update(null, new_child);
            }

            // TODO: Refactor - duplicated code
            if (new_child.elem !== old_mapped_child.elem) {
                if (new_child.elem !== null && old_mapped_child.elem !== null) {
                    old_vdom.elem.replaceChild(new_child.elem, old_mapped_child.elem);
                } else {
                    const next_vdom = old_vdom.children.find((next_child, index) => {
                        return index > old_index && next_child.elem !== null;
                    });
                    new_child.elem && old_vdom.elem.insertBefore(new_child.elem, next_vdom === undefined ? null : next_vdom.elem);
                    old_mapped_child.elem && old_vdom.elem.removeChild(old_mapped_child.elem);
                }
            }

            ++new_index;
            
        // Do index-based update if there is no key
        } else {
            update(old_child, new_child);

            if (new_child.elem !== old_child.elem) {
                if (new_child.elem !== null && old_child.elem !== null) {
                    // New child is same instance as next old child?
                    // TODO: See what happens if a node is added as a child twice
                    // TOOD: Perhaps recreate node and reuse children?
                    old_vdom.elem.replaceChild(new_child.elem, old_child.elem);
                } else {
                    const next_vdom = old_vdom.children.find((next_child, index) => {
                        return index > old_index && next_child.elem !== null;
                    });
                    new_child.elem && old_vdom.elem.insertBefore(new_child.elem, next_vdom === undefined ? null : next_vdom.elem);
                    old_child.elem && old_vdom.elem.removeChild(old_child.elem);
                }
            }

            ++old_index;
            ++new_index;
        } 
    }

    return old_vdom.elem;
}

function isVdomNode(vdom: Vdom | null): vdom is VdomNode {
    return vdom !== null && vdom._type === "VdomNode";
}

function createHTMLElement(node: VdomNode, vdom: VdomNode) {
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