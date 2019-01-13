import {Vdom, VdomNode, VdomFunctional, VdomFunctionalBase, UserVdom, BindPoint} from "./vdom";
import {redrawSync} from "./redraw";

export default update;

// Compare old and new Vdom, then put updated elem on new_vdom
// TODO: Support child arrays
// TODO: onremove()
function update(old_elem: Node | null, old_vdom: Vdom | null, new_vdom: Vdom, bindpoint: BindPoint): Node | null {
    if (new_vdom._type === "VdomFunctional") {
        return updateFunctionalVdom(old_vdom, new_vdom);
    }

    // TODO: Put logic into their own functions
    else if (new_vdom._type === "VdomText") {
        if (old_elem !== null && old_vdom !== null && old_vdom._type === "VdomText") {
            if (new_vdom.text !== old_vdom.text) {
                old_elem.nodeValue = new_vdom.text;
            }
            return old_elem;

        } else {
            return createTextNode(new_vdom.text);
        }
    }

    else if (new_vdom._type === "VdomNode") {
        if (
            old_elem === null 
            || old_vdom === null 
            || old_vdom._type === "VdomNull" 
            || old_vdom._type === "VdomText" 
            || (old_vdom._type === "VdomNode" && old_vdom.tag !== new_vdom.tag)
        ) {
            return createHTMLElement(new_vdom, bindpoint);

        } else if (old_vdom._type === "VdomFunctional") {
            return update(old_elem, old_vdom.instance, new_vdom, bindpoint);

        } else {
            return patchVdom(old_elem, old_vdom, new_vdom, bindpoint);
        }
    }

    return null;
}

function updateFunctionalVdom(old_vdom: Vdom | null, new_vdom: VdomFunctional<any, any>): Node {

    // Share bindpoint as long as possible across all instances of this vdom
    if (old_vdom !== null && old_vdom._type === "VdomFunctional") {
        new_vdom.bindpoint = old_vdom.bindpoint;
        new_vdom.bindpoint.binding = new_vdom;
    }

    // Reuse state from last time
    // Components can store state in the generator
    if (old_vdom !== null
        && old_vdom._type === "VdomFunctional"
        && old_vdom.state !== undefined
    ) {
        new_vdom.state = old_vdom.state;
    }

    // Don't redraw if passed props are the same
    if(old_vdom !== null
        && old_vdom._type === "VdomFunctional"
        && old_vdom.generator === new_vdom.generator
        && old_vdom.elem !== null
        && new_vdom.props !== undefined
    ) {
        if (!shouldUpdate(old_vdom, new_vdom)) {
            new_vdom.instance = old_vdom.instance;
            if(new_vdom.instance !== null) new_vdom.instance.parent = new_vdom;
            new_vdom.elem = old_vdom.elem;
            return new_vdom.elem;
        }
    }

    // Otherwise, redraw if passed instance is the same
    const generated = new_vdom.generator(new_vdom);
    generated.parent = new_vdom;
    if (new_vdom.instance !== generated) {
        new_vdom.elem = update(
            old_vdom !== null && old_vdom._type === "VdomFunctional"
                ? old_vdom.elem
                : null,
            old_vdom !== null && old_vdom._type === "VdomFunctional"
                ? old_vdom.instance
                : old_vdom,
            generated,
            new_vdom.bindpoint
        );
        new_vdom.instance = generated;
    }

    if (new_vdom.elem === null) {
        throw new Error("Functional vdom must create a DOM element");
    }

    return new_vdom.elem;
}

function shouldUpdate<PropType>(o: UserVdom<PropType>, n: UserVdom<PropType>) {
    if (n.shouldUpdate !== undefined) {
        return n.shouldUpdate(o.props, n.props, n.state);
    }

    if (typeof o !== typeof n) {
        return true;
    }

    if (typeof n === "object") {
        for (const key in o.props) {
            if (o.props.hasOwnProperty(key)
                && o.props[key] !== n.props[key]
            ) {
                return true;
            }
        }
    } else {
        return o !== n;
    }

    return false;
}

function createTextNode(node: string) {
    return document.createTextNode(node);
}

function patchVdom(old_elem: Node, old_vdom: VdomNode, new_vdom: VdomNode, bindpoint: BindPoint) {

    // TODO: Patch attributes, ID, classes, event handlers
    if (isElement(old_elem)) {
        patchAttributes(old_elem, old_vdom, new_vdom);
    }

    interface NodePair {
        vdom: Vdom;
        node: Node | null;
    }

    // Map keys
    // Vdom instances may be shared between old and new, so don't use them to
    // store information about the element.
    const old_elems: NodePair[] = [];   // 1:1 on DOM nodes
    const old_keyed: {[index: string]: NodePair} = {};  // Subset of vdom with keys
    const old_unkeyed: Array<NodePair> = [];            // SUbset of vdom without keys
    {
        let old_index = 0;
        let current_elem: Node | null = old_elem.firstChild;
        while (old_index < old_vdom.children.length) {
            const child = {
                vdom: old_vdom.children[old_index],
                node: old_vdom.children[old_index]._type === "VdomNull"
                    ? null
                    : current_elem
                };

            if (child.vdom._type !== "VdomNull" && current_elem !== null) {
                old_elems.push(child);
            }

            const key = keyOf(child.vdom);
            if (key !== null) {
                if (old_keyed[key] !== undefined) {
                    throw new Error("Keys must be unique.");
                }
                old_keyed[key] = child;
            } else {
                old_unkeyed.push(child);
            }

            if (current_elem !== null && child.vdom._type !== "VdomNull") {
                current_elem = current_elem.nextSibling;
            }

            ++old_index;
        }
    }

    // Update children
    let new_index = 0;
    let old_elem_index = 0;
    while (new_index < new_vdom.children.length) {
        const new_child = new_vdom.children[new_index];
        const next_node = old_elem_index < old_elems.length
            ? old_elems[old_elem_index].node
            : null;
        const next_elem = old_elem_index < old_elems.length
            ? old_elems[old_elem_index]
            : null;

        // Find old node to refer to
        let old_child;
        const new_key = keyOf(new_child);
        if (new_key !== null) {
            old_child = old_keyed[new_key];
        } else {
            old_child = old_unkeyed.shift();
        }

        // Update the child
        const new_node = old_child !== undefined
            ? update(old_child.node, old_child.vdom, new_child, bindpoint)
            : update(null, null, new_child, bindpoint);

        if (new_node === null) {
            next_node !== null && old_elem.removeChild(next_node);
            
            if(next_elem !== null) next_elem.node = null;

        } else if (next_node === null || old_child === undefined || old_child.node === null) {
            // Also handles append at end
            old_elem.insertBefore(new_node, next_node);

        } else if (new_node !== next_node) {
            next_node !== null && old_elem.replaceChild(new_node, next_node);

            // next_node may be keyed and unused, so it might not have to be
            // removed later since it's being removed here
            if(next_elem !== null) next_elem.node = null;
        }

        // Mark keyed element as used from elsewhere in the child list
        // If old node is reused and replaced at a new polace in the list,
        // the DOM first removes it. This is to update the list to reflect that fact.
        if (old_child !== undefined) {
            old_child.node = null;
        }

        ++old_elem_index;
        // Must skip over any nodes potentially set to null
        while(old_elem_index < old_elems.length && old_elems[old_elem_index].node === null)
            ++old_elem_index;
        ++new_index;
    }

    // Remove extra nodes at end
    while (old_elem_index < old_elems.length) {
        const elem = old_elems[old_elem_index];
        if (elem !== undefined && elem.node !== null) {
            old_elem.removeChild(elem.node)
            elem.node = null;
        }
        ++old_elem_index;
    }

    // Remove extra keyed nodes that were skipped over
    for (const key in old_keyed) {
        const elem = old_keyed[key].node;
        if (elem !== null) {
            old_elem.removeChild(elem);
        }
    }

    return old_elem;
}

function isElement(node: Node): node is Element {
    return "classList" in node;
}

const EXCLUDED_ATTR = new Set(["key", "shouldUpdate", "oninit", "id"]);

function patchAttributes(elem: Element, old_vdom: VdomNode, new_vdom: VdomNode) {
 
    // Patch classes
    Object.keys(new_vdom.classes).forEach(c => {
        if (! (c in old_vdom.classes) ) {
            elem.classList.add(c);
        }
    })

    Object.keys(old_vdom.classes).forEach(c => {
        if (! (c in new_vdom.classes) ) {
            elem.classList.remove(c);
        }
    })

    // Patch id
    if (old_vdom.id !== undefined && new_vdom.id === undefined) {
        elem.removeAttribute("id")
    } else if (old_vdom.id !== new_vdom.id && new_vdom.id !== undefined) {
        elem.setAttribute("id", new_vdom.id);
    }

    // Patch attributes
    Object.entries(new_vdom.attributes).forEach(([key, value]: [string, any]) => {
        if (!EXCLUDED_ATTR.has(key)) {
            const old_value = old_vdom.attributes[key];

            if (typeof value === "function") {
                const event = eventName(key);
                if (value !== old_value) {
                    if (typeof old_value === "function") {
                        elem.removeEventListener(event, old_value)
                    }
                    elem.addEventListener(event, value);
                }
            } else if(typeof value === "boolean") {
                if (value !== old_value) {
                    elem.toggleAttribute(key);
                }
            } else {
                if (value !== old_value) {
                    elem.setAttribute(key, value);
                }
            }
        }

        Object.entries(old_vdom.attributes).forEach(([key, value]: [string, any]) => {
            if (!EXCLUDED_ATTR.has(key) && !(key in new_vdom.attributes)) {
                if (typeof value === "function") {
                    elem.removeEventListener(eventName(key), value)
                } else if (typeof value === "boolean") {
                    elem.toggleAttribute(key, false)
                } else {
                    elem.removeAttribute(key);
                }
            }
        })
    })
}

function keyOf(vdom: Vdom | null) {
    if (vdom === null) {
        return null;
    }

    if (vdom._type === "VdomNode" && vdom.attributes.key !== undefined) {
        return vdom.attributes.key;
    }

    if (vdom._type === "VdomFunctional" && vdom.key !== undefined) {
        return vdom.key;
    }

    return null;
}

function createHTMLElement(vdom: VdomNode, bindpoint: BindPoint) {
    if (vdom.tag === "") {
        throw new Error("Invlaid tag");
    }

    const elem = document.createElement(vdom.tag);
    setAttributeIfExists(elem, "id", vdom.id);
    Object.keys(vdom.classes).forEach(c => elem.classList.add(c))

    Object.keys(vdom.attributes).forEach(key => {
        if (vdom.attributes.hasOwnProperty(key)) {
            applyAttribute(elem, key, vdom.attributes[key], bindpoint)
        }
    });

    vdom.children.forEach(child => {
        const child_elem = update(null, null, child, bindpoint);
        if (child_elem !== null) {
            elem.appendChild(child_elem);
        }
    });
    
    if ("oninit" in vdom.attributes && typeof vdom.attributes["oninit"] === "function") {
        vdom.attributes["oninit"](vdom, elem);
    }

    return elem;
}

function setAttributeIfExists(elem: HTMLElement, attribute: string, value: string | undefined) {
    if (value !== undefined) {
        elem.setAttribute(attribute, value);
    }
}

function applyAttribute(elem: Element, attribute: string, value: string | Function | boolean, bindpoint: BindPoint) {
    if (typeof value === "function") {
        elem.addEventListener(eventName(attribute), (evt: Event) => {
            // Vdom received in second argument will always be to nearest VdomFunctional
            if (!isVdomFunctional(bindpoint.binding)) {
                throw new Error("Invalid binding: not a functional vdom");
            }
            value(evt, bindpoint.binding);
            redrawSync(bindpoint.binding);
        });

    } else if (typeof value !== "boolean") {
        elem.setAttribute(attribute, value);
    } else {
        elem.toggleAttribute(attribute, value);
    }
}

function isVdomFunctional(vdom: VdomFunctionalBase | VdomFunctional<any, any>): vdom is VdomFunctional<any, any> {
    return "state" in vdom && "props" in vdom;
}

function eventName(key: string) {
    const regex_result = key.match(/on([\w]+)/);
    if(regex_result === null || regex_result.length < 2) {
        throw new Error(`Invalid handler: ${key}`);
    }
    return regex_result[1];
}