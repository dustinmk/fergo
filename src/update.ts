import {Vdom, VdomNode, VdomText, VdomFunctional, ComponentAttributes, BindPoint, Attributes, ClassList, Style} from "./vdom";
import {redraw} from "./redraw";
import {patchChildren} from "./patch-children";

// Compare old and new Vdom, then put updated elem on new_vdom
const update = (
    old_vdom: Vdom | null,
    new_vdom: Vdom | null,
    bindpoint: BindPoint | null
): Node | null => {
    if (new_vdom === null 
        || new_vdom._type === "VdomNull" 
        || (old_vdom !== null && new_vdom._type !== old_vdom._type)
    ) {
        if (old_vdom !== null) {
            updateNullNode(old_vdom);
        }
    } 
    
    if (new_vdom === null || new_vdom._type === "VdomNull") {
        return null;

    } else if (new_vdom._type === "VdomFunctional") {
        new_vdom.elem = updateFunctionalVdom(old_vdom, new_vdom);
    }

    else if (new_vdom._type === "VdomText") {
        new_vdom.elem = updateTextNode(old_vdom, new_vdom);
    }

    else if (new_vdom._type === "VdomFragment") {
        throw new Error("Should not be updating a VdomFragmet");
    }

    else if (new_vdom._type === "VdomNode") {
        if (bindpoint === null) {
            throw new Error("Bindpoint must not be null");
        }

        new_vdom.elem = updateNode(old_vdom, new_vdom, bindpoint);
    }

    return new_vdom.elem;
}

// Called whenever a new vdom is replacing the old one or when it is replaced with null
const updateNullNode = (old_vdom: Vdom | null) => {
    if (old_vdom === null || old_vdom._type === "VdomNull" || old_vdom._type === "VdomText") {
        return;
    }

    if (old_vdom._type === "VdomNode") {

        // Leaf-first order so the leaves still have the parents when called
        for (const child of old_vdom.children) {
            if (child._type !== "VdomNull") {
                updateNullNode(child);
            }
        }

        if (old_vdom.attributes.onremove !== undefined) {
            old_vdom.elem !== null && old_vdom.attributes.onremove(old_vdom, old_vdom.elem);
        }

    } else if (old_vdom._type === "VdomFunctional") {
        if (old_vdom.onremove !== undefined) {
            old_vdom.onremove(old_vdom);
        }

        updateNullNode(old_vdom.instance);
    }

    // old_vdom.elem = null;
}

const updateTextNode = (
    old_vdom: Vdom | null,
    new_vdom: VdomText
) => {
    if (old_vdom !== null && old_vdom.elem !== null && old_vdom._type === "VdomText") {
        const old_elem = old_vdom.elem;
        if (new_vdom.text !== old_vdom.text) {
            if(old_elem !== null) old_elem.nodeValue = new_vdom.text;
        }
        new_vdom.elem = old_vdom.elem;

    } else {
        new_vdom.elem = document.createTextNode(new_vdom.text);
    }

    return new_vdom.elem;
}

const updateFunctionalVdom = (
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

        // TODO: Copy over old hooks if undefined in new_vdom
        // TODO: Put hooks into its own object

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
            generateInstance(old_vdom, new_vdom);
        }

    // Destroy old and create new
    } else {
        old_vdom!== null && old_vdom.elem !== null && updateNullNode(old_vdom);
        generateInstance(old_vdom, new_vdom);
        new_vdom.oninit !== undefined && new_vdom.oninit(new_vdom);
    }

    if (new_vdom.elem === null) {
        throw new Error("Functional vdom must create a DOM element");
    }

    return new_vdom.elem;
}

const generateInstance = (
    old_vdom: Vdom | null,
    new_vdom: VdomFunctional<any, any>
) => {
    const generated = new_vdom.generator(new_vdom);
    generated.parent = new_vdom;

    // Don't update if the same instance is returned as last time
    if (old_vdom !== null
        && old_vdom._type === "VdomFunctional"
        && new_vdom.instance === generated
    ) {
        new_vdom.instance = old_vdom.instance;

    } else {
        if (old_vdom !== null && old_vdom._type === "VdomFunctional") {
            new_vdom.elem = update(
                old_vdom.instance,
                generated,
                new_vdom.bindpoint
            );
        } else {
            new_vdom.elem = update(
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

    // if (typeof new_vdom === "object") {
    // if (new_vdom.constructor === Object) {
        for (const key in old_vdom.props) {
            if (old_vdom.props.hasOwnProperty(key)
                && old_vdom.props[key] !== new_vdom.props[key]
            ) {
                return true;
            }
        }
    // } else {
    //     return old_vdom !== new_vdom;
    // }

    return false;
}

const updateNode = (
    old_vdom: Vdom | null,
    new_vdom: VdomNode,
    bindpoint: BindPoint
) => {
    if (
        old_vdom === null
        || old_vdom.elem === null
        || old_vdom._type === "VdomNull" 
        || old_vdom._type === "VdomText" 
        || old_vdom._type === "VdomFragment"
        || (old_vdom._type === "VdomNode" && old_vdom.tag !== new_vdom.tag)
    ) {
        if (old_vdom !== null) {
            updateNullNode(old_vdom);
        }
        return createHTMLElement(new_vdom, bindpoint);

    } else if (old_vdom._type === "VdomFunctional") {
        return update(old_vdom.instance, new_vdom, bindpoint);

    } else if (old_vdom.elem !== null) {
        return patchVdomNode(old_vdom, new_vdom, bindpoint);
    } else {
        throw new Error("if statements don't work")
    }
}

const patchVdomNode = (
    old_vdom: VdomNode,
    new_vdom: VdomNode,
    bindpoint: BindPoint
) => {

    if (old_vdom.elem === null) {
        throw new Error("Elem does not exist");
    }

    if (isElement(old_vdom.elem)) {
        patchClasses(old_vdom.elem, old_vdom.classes, new_vdom.classes);
        patchId(old_vdom.elem, old_vdom.id, new_vdom.id);
        patchAttributes(old_vdom.elem, old_vdom.attributes, new_vdom.attributes, bindpoint);
        patchStyle(
            old_vdom.elem as HTMLElement,
            old_vdom.attributes.style === undefined ? {} : old_vdom.attributes.style,
            new_vdom.attributes.style === undefined ? {} : new_vdom.attributes.style
        );
    }

    return patchChildren(old_vdom, old_vdom.children, new_vdom.children, null, bindpoint);
}

const createHTMLElement = (vdom: VdomNode, bindpoint: BindPoint) => {
    if (vdom.tag === "") {
        throw new Error("Invlaid tag");
    }

    const elem = document.createElement(vdom.tag);

    patchClasses(elem, {}, vdom.classes);
    patchId(elem, undefined, vdom.id);
    patchAttributes(elem, {}, vdom.attributes, bindpoint);

    createChildren(elem, vdom.children, bindpoint);
    
    if ("oninit" in vdom.attributes && typeof vdom.attributes["oninit"] === "function") {
        vdom.attributes["oninit"](vdom, elem);
    }

    return elem;
}

const createChildren = (elem: Node, vdoms: Vdom[], bindpoint: BindPoint) => {
    for (const child of vdoms) {
        if (child._type === "VdomFragment") {
            createChildren(elem, child.children, bindpoint);

        } else {
            const child_elem = update(null, child, bindpoint)
            if (child_elem !== null) {
                elem.appendChild(child_elem);
            }
        }
    }
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

const patchStyle = (
    elem: HTMLElement,
    old_style: Style,
    new_style: Style
) => {
    Object.keys(new_style).forEach(key => {
        if (new_style.hasOwnProperty(key)
            && new_style[key] !== undefined
            && (!old_style.hasOwnProperty(key) || old_style[key] !== new_style[key])
        ) {
            elem.style.setProperty(key, new_style[key])
        }
    });

    Object.keys(old_style).forEach(key => {
        if (old_style.hasOwnProperty(key) && !new_style.hasOwnProperty(key)) {
            elem.style.setProperty(key, null);
        }
    });
}

// TODO: Replace with plain object
const EXCLUDED_ATTR = new Set(["key", "shouldUpdate", "oninit", "onremove", "id", "style"]);
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

                // TODO: Can remove bindpoint here since redraw() tracks it
                // still call the user handler with value(vdom.bindpoint.binding)
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

const isElement = (node: Node | null): node is Element => {
    return node !== null && "classList" in node;
}

const eventName = (key: string) => {
    const regex_result = key.match(/on([\w]+)/);
    if(regex_result === null || regex_result.length < 2) {
        throw new Error(`Invalid handler: ${key}`);
    }
    return regex_result[1];
}

export default update;