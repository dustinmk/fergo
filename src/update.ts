import {Vdom, VdomNode, VdomText, VdomFunctional, BindPoint, Attributes, ClassList, Style} from "./vdom";
import {
    VDOM_NODE,
    VDOM_FRAGMENT,
    VDOM_TEXT,
    VDOM_FUNCTIONAL,
} from "./constants";
import {hasOwnProperty} from "./dom";
import {redraw} from "./redraw";
import {patchChildren} from "./patch-children";

// Compare old and new Vdom, then put updated elem on new_vdom
const update = (
    old_vdom: Vdom | null,
    new_vdom: Vdom | null,
    bindpoint: BindPoint | null
): Node | null => {
    if (new_vdom === null 
        || (old_vdom !== null && new_vdom._type !== old_vdom._type)
    ) {
        if (old_vdom !== null) {
            updateNullNode(old_vdom);
        }
    } 
    
    if (new_vdom === null) {
        return null;

    } else if (new_vdom._type === VDOM_FUNCTIONAL) {
        new_vdom.elem = updateFunctionalVdom(old_vdom, new_vdom);
    }

    else if (new_vdom._type === VDOM_TEXT) {
        new_vdom.elem = updateTextNode(old_vdom, new_vdom);
    }

    else if (new_vdom._type === VDOM_FRAGMENT) {
        throw new Error("Should not be updating a VdomFragmet");
    }

    else if (new_vdom._type === VDOM_NODE) {
        if (bindpoint === null) {
            throw new Error("Bindpoint must not be null");
        }

        new_vdom.elem = updateNode(old_vdom, new_vdom, bindpoint);
    }

    return new_vdom.elem;
}

// Called whenever a new vdom is replacing the old one or when it is replaced with null
const updateNullNode = (old_vdom: Vdom | null) => {
    if (old_vdom === null || old_vdom._type === VDOM_TEXT) {
        return;
    }

    if (old_vdom._type === VDOM_NODE || old_vdom._type === VDOM_FRAGMENT) {

        // Leaf-first order so the leaves still have the parents when called
        for (const child of old_vdom.children) {
            if (child !== null) {
                updateNullNode(child);
            }
        }

        if (old_vdom._type === VDOM_NODE && old_vdom.attributes.onremove !== undefined) {
            old_vdom.elem !== null && old_vdom.attributes.onremove(old_vdom, old_vdom.elem);
        }

    } else if (old_vdom._type === VDOM_FUNCTIONAL) {
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
    if (old_vdom !== null && old_vdom.elem !== null && old_vdom._type === VDOM_TEXT) {
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
    if (old_vdom !== null && old_vdom._type === VDOM_FUNCTIONAL) {
        new_vdom.bindpoint = old_vdom.bindpoint;
        new_vdom.bindpoint.binding = new_vdom;
    }

    // Update old
    if (old_vdom !== null
        && old_vdom._type === VDOM_FUNCTIONAL
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
            generateInstance(old_vdom, new_vdom);
        }

    // Destroy old and create new
    } else {
        old_vdom !== null && old_vdom.elem !== null && updateNullNode(old_vdom);
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
    if (generated !== null) {
        generated.parent = new_vdom;
    }

    // Don't update if the same instance is returned as last time
    if (old_vdom !== null
        && old_vdom._type === VDOM_FUNCTIONAL
        && old_vdom.instance === generated
    ) {
        new_vdom.instance = old_vdom.instance;

    } else {
        new_vdom.elem = update(
            old_vdom !== null && old_vdom._type === VDOM_FUNCTIONAL
                ? old_vdom.instance
                : old_vdom,
            generated,
            new_vdom.bindpoint
        );
        new_vdom.instance = generated;
    }
}

const shouldUpdate = <PropType>(
    old_vdom: VdomFunctional<PropType, any>,
    new_vdom: VdomFunctional<PropType, any>
) => {
    if (new_vdom.shouldUpdate !== undefined) {
        return new_vdom.shouldUpdate(old_vdom.props, new_vdom.props, new_vdom.state);
    }

    if (typeof old_vdom !== typeof new_vdom) {
        return true;
    }

    if (new_vdom.props !== null && new_vdom.props.constructor === Object) {
        for (const key in old_vdom.props) {
            if (hasOwnProperty(old_vdom.props, key)
                && old_vdom.props[key] !== new_vdom.props[key]
            ) {
                return true;
            }
        }
    } else {
        return old_vdom.props !== new_vdom.props;
    }

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
        || old_vdom._type === VDOM_TEXT
        || old_vdom._type === VDOM_FRAGMENT
        || (old_vdom._type === VDOM_NODE && old_vdom.tag !== new_vdom.tag)
    ) {
        if (old_vdom !== null) {
            updateNullNode(old_vdom);
        }
        return createHTMLElement(new_vdom, bindpoint);

    } else if (old_vdom._type === VDOM_FUNCTIONAL) {
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
        throw new Error("Invalid tag");
    }

    const elem = document.createElement(vdom.tag);

    patchClasses(elem, {}, vdom.classes);
    vdom.attributes.style !== undefined && patchStyle(elem, {}, vdom.attributes.style);
    patchAttributes(elem, {}, vdom.attributes, bindpoint);

    createChildren(elem, vdom.children, bindpoint);
    
    if ("oninit" in vdom.attributes && typeof vdom.attributes.oninit === "function") {
        vdom.attributes.oninit(vdom, elem);
    }

    return elem;
}

const createChildren = (elem: Node, vdoms: Array<Vdom | null>, bindpoint: BindPoint) => {
    for (const child of vdoms) {
        if (child !== null && child._type === VDOM_FRAGMENT) {
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

const patchStyle = (
    elem: HTMLElement,
    old_style: Style,
    new_style: Style
) => {
    Object.keys(new_style).forEach(key => {
        if (new_style[key] !== undefined
            && (!hasOwnProperty(old_style, key) || old_style[key] !== new_style[key])
        ) {
            elem.style.setProperty(key, new_style[key])
        }
    });

    Object.keys(old_style).forEach(key => {
        if (!hasOwnProperty(new_style, key)) {
            elem.style.setProperty(key, null);
        }
    });
}

interface Handler {
    vdom: Vdom | null,
    userHandler: ((event: Event, vdom: Vdom) => void | Promise<void>) | null,
    handler: EventHandlerNonNull;
}

const makeHandler = () => {
    const binding: Handler = {
        vdom: null,
        userHandler: null,
        handler: (event: Event) => {
            if (binding.vdom !== null && binding.userHandler !== null) {
                const returned = binding.userHandler(event, binding.vdom);
                if (returned instanceof Promise) {
                    returned.then(() => binding.vdom !== null && redraw(binding.vdom));
                } else {
                    redraw(binding.vdom);
                }
            }
        }
    };
    
    return binding;
}

const patchAttributes = (
    elem: Element,
    old_attr: Attributes,
    new_attr: Attributes,
    bindpoint: BindPoint
) => {
    Object.entries(new_attr).forEach(([key, value]: [string, any]) => {
        if (!EXCLUDED_ATTR.has(key) && !isReservedAttribute(key) && value !== old_attr[key]) {
            if (key === "value") {
                (<HTMLInputElement>elem).value = value;
                
            } else if (typeof value === "function") {

                // Inject the user-provided handler to a static event handler
                // through the closure. Update the bound object in the event handler
                // closure with the user-provided event handler for fast updates.
                // Only add/remove the event handler if there was no event handler before/after
                const event = eventName(key);
                const ref_name = `__on${event}_ref`;
                let handler;
                if (old_attr[ref_name] === undefined) {
                    handler = makeHandler();
                    elem.addEventListener(event, handler.handler);
                } else {
                    handler = old_attr[ref_name];
                }
                handler.userHandler = value;
                handler.vdom = bindpoint.binding;
                new_attr[ref_name] = handler;

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
                const ref_name = `__on${event_name}_ref`;
                elem.removeEventListener(event_name, old_attr[ref_name].handler);

            } else if (typeof value === "boolean") {
                elem.toggleAttribute(key, false);

            } else {
                elem.removeAttribute(key);
            }
        }
    })
}

const EXCLUDED_ATTR = new Set(["key", "shouldUpdate", "oninit", "onremove", "style"]);
const isReservedAttribute = (key: string) => {
    return EXCLUDED_ATTR.has(key) || key.match(/__on.*_ref/) !== null;
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