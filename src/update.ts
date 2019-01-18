import {Vdom, VdomNode, VdomText, VdomFunctional, ComponentAttributes, BindPoint, Attributes, ClassList} from "./vdom";
import {redraw} from "./redraw";

// Compare old and new Vdom, then put updated elem on new_vdom
// TODO: Support child arrays
const update = (
    old_elem: Node | null,
    old_vdom: Vdom | null,
    new_vdom: Vdom | null,
    bindpoint: BindPoint | null
): Node | null => {
    if (new_vdom === null 
        || new_vdom._type === "VdomNull" 
        || (old_vdom !== null && new_vdom._type !== old_vdom._type)
    ) {
        if (old_elem !== null) {
            updateNullNode(old_elem, old_vdom);
        }
    } 
    
    if (new_vdom === null) {

    } else if (new_vdom._type === "VdomFunctional") {
        return updateFunctionalVdom(old_elem, old_vdom, new_vdom);
    }

    else if (new_vdom._type === "VdomText") {
        return updateTextNode(old_elem, old_vdom, new_vdom);
    }

    else if (new_vdom._type === "VdomNode") {
        if (bindpoint === null) {
            throw new Error("Bindpoint must not be null");
        }

        return updateNode(old_elem, old_vdom, new_vdom, bindpoint);
    }

    return null;
}

// Called whenever a new vdom is replacing the old one or when it is replaced with null
const updateNullNode = (old_elem: Node, old_vdom: Vdom | null) => {
    if (old_vdom === null || old_vdom._type === "VdomNull" || old_vdom._type === "VdomText") {
        return;
    }

    if (old_vdom._type === "VdomNode") {

        // Leaf-first order so the leaves still have the parents when called
        const child_nodes: Node[] = [];
        old_elem.childNodes.forEach(child => child_nodes.push(child));
        let child_node_index = 0;

        for (const child of old_vdom.children) {
            if (child._type !== "VdomNull") {
                updateNullNode(child_nodes[child_node_index], child);
                ++child_node_index;
            }
        }

        if (old_vdom.attributes.onremove !== undefined) {
            old_vdom.attributes.onremove(old_vdom, old_elem);
        }

    } else if (old_vdom._type === "VdomFunctional") {
        if (old_vdom.onUnmount !== undefined) {
            old_vdom.onUnmount(old_vdom);
        }

        updateNullNode(old_elem, old_vdom.instance);
    }
}

const updateTextNode = (
    old_elem: Node | null,
    old_vdom: Vdom | null,
    new_vdom: VdomText
) => {
    if (old_elem !== null && old_vdom !== null && old_vdom._type === "VdomText") {
        if (new_vdom.text !== old_vdom.text) {
            old_elem.nodeValue = new_vdom.text;
        }
        return old_elem;

    } else {
        return document.createTextNode(new_vdom.text);
    }
}

const updateFunctionalVdom = (
    old_elem: Node | null,
    old_vdom: Vdom | null,
    new_vdom: VdomFunctional<any, any>
): Node => {

    // Share bindpoint as long as possible across all instances of this vdom
    // The bindpoint should be shared even for different generators since some
    // DOM elements may still be share between instances
    if (old_vdom !== null && old_vdom._type === "VdomFunctional") {
        new_vdom.bindpoint = old_vdom.bindpoint;
        new_vdom.bindpoint.binding = new_vdom;
    }

    // Update old
    if (old_vdom !== null
        && old_vdom._type === "VdomFunctional"
        && old_vdom.generator === new_vdom.generator
    ) {
        // Reuse state from last time
        // Components can store state in the generator
        new_vdom.state = old_vdom.state;

        // Don't redraw if passed props are the same
        if (old_vdom.elem !== null
            && new_vdom.props !== undefined
            && !shouldUpdate(old_vdom, new_vdom)
        ) {
            new_vdom.instance = old_vdom.instance;
            if(new_vdom.instance !== null) new_vdom.instance.parent = new_vdom;
            new_vdom.elem = old_vdom.elem;
            return new_vdom.elem;

        // Otherwise, redraw
        } else {
            generateInstance(old_elem, old_vdom, new_vdom);
        }

    // Destroy old and create new
    } else {
        old_elem !== null && updateNullNode(old_elem, old_vdom);
        generateInstance(old_elem, old_vdom, new_vdom);
        new_vdom.onMount !== undefined && new_vdom.onMount(new_vdom);
    }

    if (new_vdom.elem === null) {
        throw new Error("Functional vdom must create a DOM element");
    }

    return new_vdom.elem;
}

const generateInstance = (
    old_elem: Node | null,
    old_vdom: Vdom | null,
    new_vdom: VdomFunctional<any, any>
) => {
    const generated = new_vdom.generator(new_vdom);
    generated.parent = new_vdom;
    if (new_vdom.instance !== generated) {
        if (old_vdom !== null && old_vdom._type === "VdomFunctional") {
            new_vdom.elem = update(
                old_vdom.elem, 
                old_vdom.instance,
                generated,
                new_vdom.bindpoint
            );
        } else {
            new_vdom.elem = update(
                old_elem,
                old_vdom,
                generated,
                new_vdom.bindpoint
            );
        }
        new_vdom.instance = generated;
    }
}

const shouldUpdate = <PropType>(
    old_vdom: ComponentAttributes<PropType>,
    new_vdom: ComponentAttributes<PropType>
) => {
    if (new_vdom.shouldUpdate !== undefined) {
        return new_vdom.shouldUpdate(old_vdom.props, new_vdom.props, new_vdom.state);
    }

    if (typeof old_vdom !== typeof new_vdom) {
        return true;
    }

    if (typeof new_vdom === "object") {
        for (const key in old_vdom.props) {
            if (old_vdom.props.hasOwnProperty(key)
                && old_vdom.props[key] !== new_vdom.props[key]
            ) {
                return true;
            }
        }
    } else {
        return old_vdom !== new_vdom;
    }

    return false;
}

const updateNode = (
    old_elem: Node | null,
    old_vdom: Vdom | null,
    new_vdom: VdomNode,
    bindpoint: BindPoint
) => {
    if (
        old_elem === null 
        || old_vdom === null 
        || old_vdom._type === "VdomNull" 
        || old_vdom._type === "VdomText" 
        || (old_vdom._type === "VdomNode" && old_vdom.tag !== new_vdom.tag)
    ) {
        if (old_elem !== null) {
            updateNullNode(old_elem, old_vdom);
        }
        return createHTMLElement(new_vdom, bindpoint);

    } else if (old_vdom._type === "VdomFunctional") {
        return update(old_elem, old_vdom.instance, new_vdom, bindpoint);

    } else {
        return patchVdom(old_elem, old_vdom, new_vdom, bindpoint);
    }
}

interface NodePair {
    vdom: Vdom;
    node: Node | null;
}

const patchVdom = (
    elem: Node,
    old_vdom: VdomNode,
    new_vdom: VdomNode,
    bindpoint: BindPoint
) => {

    if (isElement(elem)) {
        patchClasses(elem, old_vdom.classes, new_vdom.classes);
        patchId(elem, old_vdom.id, new_vdom.id);
        patchAttributes(elem, old_vdom.attributes, new_vdom.attributes, bindpoint);
    }

    const {dom_children, unkeyed, keyed} = mapVdomToDOM(elem, old_vdom);

    // Update children
    let next_elem_index = 0;
    let next_elem = dom_children[0] || null;
    let unkeyed_index = 0;
    
    // Iterating from from to back.
    // Using Array.shift() is slightly cleaner, but a lot slower than Array.pop()
    // and indexing.
    for (const new_child of new_vdom.children) {

        // Find old node to refer to
        const new_key = keyOf(new_child);
        const old_child = (new_key !== null
            ? keyed[new_key]
            : unkeyed[unkeyed_index++]
        ) || null;

        // Update the child
        // TODO: Don't access elem unless necessary - pass getter or index instead
        const new_elem = old_child !== null
            ? update(old_child.node, old_child.vdom, new_child, bindpoint)
            : update(null, null, new_child, bindpoint);

        // Insert new elem into right spot in child list
        patchChildElem(
            elem,
            new_elem,
            old_child,
            next_elem
        );

        // Must skip over any nodes potentially set to null
        do {
            ++next_elem_index;
            next_elem = dom_children[next_elem_index] || null
        } while(next_elem !== null && next_elem.node === null)
    }

    // Remove any unrecycled elements
    removeExtraUnkeyed(elem, unkeyed, next_elem_index);
    removeExtraKeyed(elem, keyed);

    return elem;
}

// TODO: Assign node index, not actual node to avoid accessing uncessesary nodes
// Memoize node accesses
const mapVdomToDOM = (elem: Node, vdom: VdomNode) => {
    // Map keys
    // Vdom instances may be shared between old and new, so don't use them to
    // store information about the element.
    const dom_children: NodePair[] = [];
    const child_elems = getChildElems(elem);

    const keyed: {[index: string]: NodePair} = {};  // Subset of vdom with keys
    const unkeyed: Array<NodePair> = [];            // Subset of vdom without keys
    let elem_index = 0;

    for(const vdom_child of vdom.children) {
        const key = keyOf(vdom_child);
        const child = vdom_child._type === "VdomNull"
            ? {vdom: vdom_child, node: null}
            : {vdom: vdom_child, node: child_elems[elem_index]}
        
        if (vdom_child._type !== "VdomNull") {
            dom_children.push(child);
            ++elem_index;
        }
        
        if (key !== null) {
            if (keyed[key] !== undefined) {
                throw new Error("Keys must be unique.");
            }
            keyed[key] = child;

        } else {
            unkeyed.push(child);
        }
    }

    return {dom_children, unkeyed, keyed}
}

const getChildElems = (elem: Node) => {
    const child_elems: Node[] = new Array(elem.childNodes.length);
    let index = 0;
    elem.childNodes.forEach(node => child_elems[index++] = node);
    return child_elems;
}

const patchChildElem = (
    elem: Node,
    new_node: Node | null,
    old_child: NodePair | null,
    next_elem: NodePair | null
) => {
    const old_node = old_child !== null
        ? old_child.node
        : null;
    const next_node = next_elem !== null
        ? next_elem.node
        : null;

    // next_node may be keyed and unused, so it might not have to be
    // removed later since it's being removed here, so flag it with null
    // as required
    if (new_node === null) {
        next_node !== null && elem.removeChild(next_node);
        if (next_elem !== null && next_elem.node !== null)
            next_elem.node = null;

    } else if (next_node === null || old_node === null) {
        elem.insertBefore(new_node, next_node);

    } else if (new_node !== next_node) {
        elem.replaceChild(new_node, next_node);
        if (next_elem !== null && next_elem.node !== null)
            next_elem.node = null;
    }

    // Mark keyed element as used from elsewhere in the child list
    // If old node is reused and replaced at a new place in the list,
    // the DOM first removes it. This is to update the list to reflect that fact.
    if (old_child !== null) {
        old_child.node = null;
    }
}

const removeExtraUnkeyed = (
    elem: Node,
    unkeyed: NodePair[],
    unused_unkeyed_start: number
) => {
    for (let unkeyed_index = unused_unkeyed_start; unkeyed_index < unkeyed.length; ++unkeyed_index) {
        const removed_elem = unkeyed[unkeyed_index];
        if (removed_elem !== null && removed_elem.node !== null) {
            update(removed_elem.node, removed_elem.vdom, null, null);
            elem.removeChild(removed_elem.node)
            removed_elem.node = null;
        }
    }
}

const removeExtraKeyed = (elem: Node, keyed: {[index: string]: NodePair}) => {
    for (const key in keyed) {
        const removed_elem = keyed[key];
        if (removed_elem !== null && removed_elem.node !== null) {
            update(removed_elem.node, removed_elem.vdom, null, null);
            elem.removeChild(removed_elem.node);
        }
    }
}

const createHTMLElement = (vdom: VdomNode, bindpoint: BindPoint) => {
    if (vdom.tag === "") {
        throw new Error("Invlaid tag");
    }

    const elem = document.createElement(vdom.tag);

    patchClasses(elem, {}, vdom.classes);
    patchId(elem, undefined, vdom.id);
    patchAttributes(elem, {}, vdom.attributes, bindpoint);

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

const patchClasses = (elem: Element, old_classes: ClassList, new_classes: ClassList) => {
    Object.keys(new_classes).forEach(c => {
        if (! (c in old_classes) ) {
            elem.classList.add(c);
        }
    })

    Object.keys(old_classes).forEach(c => {
        if (! (c in new_classes) ) {
            elem.classList.remove(c);
        }
    })
}

const patchId = (
    elem: Element,
    old_id: string | undefined,
    new_id: string | undefined
) => {
    if (old_id !== undefined && new_id === undefined) {
        elem.removeAttribute("id")
    } else if (old_id !== new_id && new_id !== undefined) {
        elem.setAttribute("id", new_id);
    }
}

// TODO: patchStyle()

const EXCLUDED_ATTR = new Set(["key", "shouldUpdate", "oninit", "id"]);
const patchAttributes = (
    elem: Element,
    old_attr: Attributes,
    new_attr: Attributes,
    bindpoint: BindPoint
) => {
    Object.entries(new_attr).forEach(([key, value]: [string, any]) => {
        if (!EXCLUDED_ATTR.has(key) && value !== old_attr[key]) {
            const old_value = old_attr[key];

            if (typeof value === "function") {
                const event = eventName(key);
                const ref_name = `_on${event}_ref`;

                if (typeof old_value === "function") {
                    elem.removeEventListener(event, old_attr[ref_name])
                }

                const handler = (evt: Event) => {
                    // Vdom received in second argument will always be to nearest VdomFunctional
                    if (!isVdomFunctional(bindpoint.binding)) {
                        throw new Error("Invalid binding: not a functional vdom");
                    }
                    value(evt, bindpoint.binding);
                    redraw(bindpoint.binding);
                };
                new_attr[ref_name] = handler;
                elem.addEventListener(event, handler);

            } else if(typeof value === "boolean") {
                elem.toggleAttribute(key, value);

            } else {
                elem.setAttribute(key, value);
            }
        }
    })

    Object.entries(old_attr).forEach(([key, value]: [string, any]) => {
        if (!EXCLUDED_ATTR.has(key) && !(key in new_attr)) {

            // Only remove event handlers at _on{event}_ref since the user-provided
            // on{event} were not directly added as a listener
            if (typeof value === "function" && key.substr(0, 2) === "on") {
                const event_name = eventName(key);
                const ref_name = `_on${event_name}_ref`;
                elem.removeEventListener(event_name, old_attr[ref_name]);

            } else if (typeof value === "boolean") {
                elem.toggleAttribute(key, false);

            } else {
                elem.removeAttribute(key);
            }
        }
    })
}

const isVdomFunctional = (
    vdom: VdomFunctional<any, any>
): vdom is VdomFunctional<any, any> => {
    return "state" in vdom && "props" in vdom;
}

const isElement = (node: Node): node is Element => {
    return "classList" in node;
}

const eventName = (key: string) => {
    const regex_result = key.match(/on([\w]+)/);
    if(regex_result === null || regex_result.length < 2) {
        throw new Error(`Invalid handler: ${key}`);
    }
    return regex_result[1];
}

const keyOf = (vdom: Vdom | null) => {
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

export default update;