import {Vdom, VdomNode, VdomText, VdomFunctional,  Attributes, BindPoint, Style} from "./vdom";
import {
    VDOM_NODE,
    VDOM_FRAGMENT,
    VDOM_TEXT,
    VDOM_FUNCTIONAL,
} from "./constants";
import {redraw} from "./redraw";
import {patchChildren} from "./patch-children";

// Compare old and new Vdom, then put updated elem on new_vdom
const update = (
    old_vdom: Vdom | null,
    new_vdom: Vdom | null,
    bindpoint: BindPoint | null,
    init_queue: Array<VdomNode>
): Node | null => {
    if (old_vdom !== null
        && (new_vdom === null || new_vdom.node_type !== old_vdom.node_type)
    ) {
        updateNullNode(old_vdom);
    } 
    
    if (new_vdom === null) {
        return null;

    } else if (new_vdom.node_type === VDOM_FUNCTIONAL) {
        new_vdom.elem = updateFunctionalVdom(old_vdom, new_vdom, init_queue);
        
    } else if (new_vdom.node_type === VDOM_TEXT) {
        new_vdom.elem = updateTextNode(old_vdom, new_vdom);

    } else if (new_vdom.node_type === VDOM_NODE) {
        if (bindpoint === null) throw new Error("Bindpoint must not be null");
        new_vdom.elem = updateNode(old_vdom, new_vdom, bindpoint, init_queue);
        new_vdom.binding = bindpoint;

    } else if (new_vdom.node_type === VDOM_FRAGMENT) {
        throw new Error("Should not be updating a VdomFragmet");
    }

    return new_vdom.elem;
}

// Called whenever a new vdom is replacing the old one or when it is replaced with null
const updateNullNode = (old_vdom: Vdom | null) => {
    if (old_vdom === null || old_vdom.node_type === VDOM_TEXT) {
        return;
    }

    // Leaf-first order so the leaves still have the parents when called
    if (old_vdom.node_type === VDOM_NODE || old_vdom.node_type === VDOM_FRAGMENT) {
        for (const child of old_vdom.children) {
            if (child !== null) {
                updateNullNode(child);
            }
        }
    }

    if (old_vdom.node_type === VDOM_FUNCTIONAL && old_vdom.attributes.onremove !== undefined) {
        old_vdom.attributes.onremove(old_vdom);
    } else if (old_vdom.node_type === VDOM_NODE && old_vdom.attributes.onremove !== undefined) {
        old_vdom.attributes.onremove(old_vdom);
    }
}

const updateTextNode = (
    old_vdom: Vdom | null,
    new_vdom: VdomText
) => {
    if (old_vdom === null || old_vdom.elem === null || old_vdom.node_type !== VDOM_TEXT) {
        return document.createTextNode(new_vdom.value);

    } else {
        if (new_vdom.value !== old_vdom.value) {
            // Null check override operator since the TS parser can't figure out that old_vodm.elem is never null here
            old_vdom.elem!.nodeValue = new_vdom.value;
        }

        return old_vdom.elem;
    }
}

const updateFunctionalVdom = (
    old_vdom: Vdom | null,
    new_vdom: VdomFunctional<any, any>,
    init_queue: VdomNode[]
): Node => {

    // Share bindpoint as long as possible across all instances of this vdom
    // The bindpoint should be shared even for different generators since some
    // DOM elements may still be share between instances
    if (old_vdom !== null && old_vdom.node_type === VDOM_FUNCTIONAL) {
        new_vdom.binding = old_vdom.binding;
        new_vdom.binding.bindpoint = new_vdom;
    }

    // Update old
    if (old_vdom !== null
        && old_vdom.node_type === VDOM_FUNCTIONAL
        && old_vdom.value === new_vdom.value
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
            if(new_vdom.instance !== null) new_vdom.instance.mounted = true;

            // Drill down to first instance in case of deep nested functional vdoms
            let elem_vdom: Vdom | null = old_vdom;
            while(elem_vdom !== null && elem_vdom.node_type === VDOM_FUNCTIONAL)
                elem_vdom = elem_vdom.instance;
            if (elem_vdom === null || elem_vdom.elem === null) throw new Error("Instance cannot be null");
            new_vdom.elem = elem_vdom.elem;

            return new_vdom.elem;

        // Otherwise, redraw
        } else {
            generateInstance(old_vdom, new_vdom, init_queue);
        }

    // Destroy old and create new
    } else {
        old_vdom !== null && old_vdom.elem !== null && updateNullNode(old_vdom);
        generateInstance(old_vdom, new_vdom, init_queue);
        new_vdom.attributes.oninit !== undefined && new_vdom.attributes.oninit(new_vdom);
    }

    if (new_vdom.elem === null) {
        throw new Error("Functional vdom must create a DOM element");
    }

    return new_vdom.elem;
}

// TODO: Merge back into updateFunctionalVdom
const generateInstance = (
    old_vdom: Vdom | null,
    new_vdom: VdomFunctional<any, any>,
    init_queue: VdomNode[]
) => {
    const generated = new_vdom.value(new_vdom);
    if (generated !== null) {
        generated.mounted = true;
    }

    // Don't update if the same instance is returned as last time
    if (old_vdom === null
        || old_vdom.node_type !== VDOM_FUNCTIONAL
        || old_vdom.instance !== generated
    ) {
        new_vdom.elem = update(
            old_vdom !== null && old_vdom.node_type === VDOM_FUNCTIONAL
                ? old_vdom.instance
                : old_vdom,
            generated,
            new_vdom.binding,
            init_queue
        );
    }

    new_vdom.instance = generated;
    new_vdom.elem = generated.elem;
}

export const shouldUpdate = <PropType>(
    old_vdom: VdomFunctional<PropType & {[index: string]: any}, any>,
    new_vdom: VdomFunctional<PropType & {[index: string]: any}, any>
) => {
    if (old_vdom.attributes.shouldUpdate !== undefined) {
        return old_vdom.attributes.shouldUpdate(old_vdom.props, new_vdom.props, new_vdom.state);
        
    } else if (typeof old_vdom !== typeof new_vdom) {
        return true;

    } else if (new_vdom.props !== undefined && new_vdom.props.constructor === Object) {
        for (const key in old_vdom.props) {

            if (old_vdom.props[key] !== new_vdom.props[key]) {
                return true;
            }
        }
        return false;

    } else {
        return old_vdom.props !== new_vdom.props;
    }
}

// TODO: Merge back into update and reorder ifs
const updateNode = (
    old_vdom: Vdom | null,
    new_vdom: VdomNode,
    bindpoint: BindPoint | null,
    init_queue: VdomNode[]
) => {
    if (old_vdom !== null && old_vdom.node_type === VDOM_FUNCTIONAL) {
        return update(old_vdom.instance, new_vdom, bindpoint, init_queue);

    } else if (old_vdom !== null && old_vdom.node_type === VDOM_NODE && old_vdom.value === new_vdom.value) {
        return patchVdomNode(old_vdom, new_vdom, bindpoint, init_queue);

    } else {
        // This is a duplicate call
        updateNullNode(old_vdom);
        return createHTMLElement(new_vdom, bindpoint, init_queue);
    }
}

const patchVdomNode = (
    old_vdom: VdomNode,
    new_vdom: VdomNode,
    bindpoint: BindPoint | null,
    init_queue: VdomNode[]
) => {

    if (old_vdom.elem === null) {
        throw new Error("Elem does not exist");
    }

    const old_vdom_elem: HTMLElement = <HTMLElement>old_vdom.elem;
    patchClasses(old_vdom_elem, old_vdom.classes, new_vdom.classes);
    patchAttributes(old_vdom_elem, old_vdom.attributes, new_vdom.attributes, bindpoint);
    patchStyle(
        old_vdom_elem,
        old_vdom.attributes.style === undefined ? {} : old_vdom.attributes.style,
        new_vdom.attributes.style === undefined ? {} : new_vdom.attributes.style
    );

    if (new_vdom.children.length === 1 && new_vdom.children[0] !== null && new_vdom.children[0]!.node_type === VDOM_TEXT) {

        // Fastpath for childlist which are a single text node
        if (old_vdom.children.length !== 1
            || old_vdom.children[0] === null
            || old_vdom.children[0]!.node_type !== VDOM_TEXT
        ) {
            old_vdom.children.forEach(child => updateNullNode(child));
            // This implicitly removes DOM children
            old_vdom.elem.textContent = (new_vdom.children[0] as VdomText).value;
            new_vdom.children[0]!.elem = old_vdom.elem.firstChild;
        } else if ((old_vdom.children[0]! as VdomText).value !== (new_vdom.children[0]! as VdomText).value) {
            (old_vdom.children[0]! as VdomText).elem!.nodeValue = (new_vdom.children[0] as VdomText).value;
            (new_vdom.children[0] as VdomText).elem = (old_vdom.children[0]! as VdomText).elem;
        }
        
        return old_vdom.elem;

    } else {
        return patchChildren(old_vdom, old_vdom.children, new_vdom.children, null, bindpoint, init_queue);
    }
}

const createHTMLElement = (vdom: VdomNode, bindpoint: BindPoint | null, init_queue: VdomNode[]) => {
    if (vdom.value === "") {
        throw new Error("Invalid tag");
    }

    const elem = vdom.namespace === null
        ? document.createElement(vdom.value)
        : document.createElementNS(vdom.namespace, vdom.value);

    patchClasses(elem, "", vdom.classes);
    vdom.attributes.style !== undefined && vdom.namespace === null && patchStyle(<HTMLElement>elem, {}, vdom.attributes.style);
    patchAttributes(elem, {}, vdom.attributes, bindpoint);

    createChildren(elem, vdom.children, bindpoint, init_queue);
    
    vdom.elem = elem;
    if (vdom.attributes.oninit !== undefined) {
        init_queue.push(vdom);
    }

    return elem;
}

const createChildren = (elem: Node, vdoms: Array<Vdom | null>, bindpoint: BindPoint | null, init_queue: VdomNode[]) => {
    if (vdoms.length === 1 && vdoms[0] !== null && vdoms[0]!.node_type === VDOM_TEXT) {
        elem.textContent = (vdoms[0] as VdomText).value;
        (vdoms[0] as VdomText).elem = elem.firstChild;
        return;
    }

    for (const child of vdoms) {
        if (child === null) {
            continue;
        } else if(child.node_type === VDOM_FRAGMENT) {
            createChildren(elem, child.children, bindpoint, init_queue);

        } else if (child.node_type === VDOM_NODE) {
            const child_elem = createHTMLElement(child, bindpoint, init_queue);
            if (bindpoint !== null) child.binding = bindpoint;
            if (child_elem !== null) elem.appendChild(child_elem);

        } else if (child.node_type === VDOM_FUNCTIONAL) {
            const child_elem = createFunctional(child, init_queue);
            if (child_elem !== null) elem.appendChild(child_elem);

        } else {
            // TODO: Separate create path once the root node is determined to be new
            // Don't use update()
            const child_elem = update(null, child, bindpoint, init_queue)
            if (child_elem !== null) {
                elem.appendChild(child_elem);
            }
        }
    }
}

const createFunctional = (vdom: VdomFunctional, init_queue: VdomNode[]): Node | null => {
    vdom.instance = vdom.value(vdom);
    vdom.mounted = true;
    if (vdom.instance.node_type === VDOM_NODE) {
        vdom.elem = createHTMLElement(vdom.instance, vdom.binding, init_queue)
    } else if (vdom.instance.node_type === VDOM_FUNCTIONAL) {
        vdom.elem = createFunctional(vdom.instance, init_queue);
    }
    vdom.instance.mounted = true;
    vdom.attributes.oninit !== undefined && vdom.attributes.oninit(vdom);
    return vdom.elem as Node | null;
}

const patchClasses = (elem: Element, old_classes: string, new_classes: string) => {
    if (old_classes !== new_classes) {
        if (new_classes.length === 0) {
            elem.removeAttribute("class");
        } else {
            elem.setAttribute("class", new_classes);
        }
    }
}

const patchStyle = (
    elem: HTMLElement,
    old_style: Style,
    new_style: Style
) => {
    for (const key in new_style) {
        if (new_style[key] !== undefined && old_style[key] !== new_style[key]) {
            elem.style.setProperty(key, new_style[key])
        }
    }

    for (const key in old_style) {
        if (new_style[key] === undefined) {
            elem.style.setProperty(key, null);
        }
    }
}

interface Handler {
    bindpoint: BindPoint,
    userHandler: ((event: Event, vdom: Vdom) => void | Promise<void> | boolean),
    handler: EventHandlerNonNull;
    redraw: boolean;
    useCapture: boolean;
}

const makeHandler = (bindpoint: BindPoint, userHandler: (e: Event) => any, do_redraw: boolean, useCapture: boolean) => {
    const binding: Handler = {
        bindpoint: bindpoint,
        userHandler: userHandler,
        redraw: do_redraw,
        useCapture: useCapture,
        handler: (event: Event) => {
            if (binding.bindpoint.bindpoint === null) throw new Error("Bindpoing must not be null");
            const returned = binding.userHandler(event, binding.bindpoint.bindpoint);
            if (returned instanceof Promise) {
                returned.then(() => binding.redraw && binding.bindpoint.bindpoint !== null && redraw(binding.bindpoint.bindpoint));
            } else {
                binding.redraw && redraw(binding.bindpoint.bindpoint);
            }
            return returned;
        }
    };
    
    return binding;
}

const patchAttributes = (
    elem: Element,
    old_attr: Attributes,
    new_attr: Attributes,
    bindpoint: BindPoint | null
) => {
    for (const key in new_attr) {
        const value = new_attr[key];
        if (!EXCLUDED_ATTR.has(key) && value !== old_attr[key]) {
            if (key === "value") {
                (<HTMLInputElement>elem).value = value;
                
            } else if (key.startsWith("on")) {

                let userHandler: (e: Event) => any;
                let redraw = true;
                let useCapture = false;

                if (typeof value === "function") {
                    userHandler = value;
                } else {
                    userHandler = value.handler;
                    redraw = value.redraw === undefined ? true : value.redraw;
                    useCapture = value.useCapture === undefined ? false : value.useCapture;
                }

                if (bindpoint === null) throw new Error("Bindpoint must not be null");

                // Only make one object and bind directly onto on{event}
                let handler: Handler;
                if (old_attr[key] === undefined) {
                    
                    handler = makeHandler(bindpoint, userHandler, redraw, useCapture);
                    elem.addEventListener(
                        key.slice(2),
                        handler.handler,
                        useCapture
                    )
                } else {
                    handler = old_attr[key] as Handler;
                    handler.userHandler = userHandler;
                    handler.redraw = redraw;
                    handler.bindpoint = bindpoint;

                    if (useCapture !== handler.useCapture) {
                        handler.useCapture = useCapture;
                        const event = key.slice(2);
                        elem.removeEventListener(event, handler.handler);
                        elem.addEventListener(event, handler.handler, useCapture);
                    }
                }
                new_attr[key] = handler;

            } else if(typeof value === "boolean") {
                elem.toggleAttribute(key, value);

            } else {
                elem.setAttribute(key, value);
            }
        }
    }

    for (const key in old_attr) {
        const value = old_attr[key];
        if (!EXCLUDED_ATTR.has(key) && new_attr[key] === undefined) {

            // Only remove event handlers at _on{event}_ref since the user-provided
            // on{event} were not directly added as a listener
            if (typeof value === "function" && key.startsWith("on")) {
                const event = key.slice(2);
                elem.removeEventListener(event, old_attr[key].handler);

            } else if (typeof value === "boolean") {
                elem.toggleAttribute(key, false);

            } else {
                elem.removeAttribute(key);
            }
        }
    }
}

const EXCLUDED_ATTR = new Set(["key", "shouldUpdate", "oninit", "onremove", "style", "namespace"]);

export default update;