// TODO: JSX compatible variant
// TODO: Functional vdom should be passed vdom instance v = {value: (vdom) => Vdom}; n = v.value(v);
// This will allow redraws easier, especially in an oninit() call

export interface Vdom {
    _type: "Vdom";
    parent: Vdom | null;
    elem: Node | null;
    value: VdomNode | VdomFunction | string;    // Value set by user
    node: VdomNode | string | null;             // Value used internally
}

export interface VdomNode {
    _type: "VdomNode";
    tag: string;
    id: string | undefined;
    attributes: CustomAttr & Attributes;
    classes: string[];
    children: Vdom[];
}

interface Attributes {
    _type?: "Attributes";
}

interface CustomAttr {
    [index: string]: any;
}

export type VdomFunction = () => Vdom;

export type Child = Vdom | VdomFunction | string | null | boolean;

// TODO: Make string child a different custom attribute, not a child
export function v(selector: VdomFunction): Vdom;
export function v(selector: string): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes): Vdom;
export function v(selector: string, children: Child[]): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes, children: Child[]): Vdom;
export function v(selector: string, children: Child): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes, children: Child): Vdom;
export function v(selector: string | VdomFunction, arg1?: CustomAttr & Attributes | Child[] | Child, arg2?: Child[] | Child): Vdom {

    // Shortcut if a functional component
    if(typeof selector === "function") {
        return {
            _type: "Vdom",
            parent: null,
            elem: null,
            value: selector,
            node: null,     // Lazy load instance
        }
    }

    // Standardize arguments for v_impl()
    let children: Child[] = [];
    let attributes = {};

    if (typeof arg1 === "string") {
        children = [arg1];
    } else if (typeof arg1 === "function") {
        children = [arg1];
    } else if (arg1 instanceof Array) {
        children = arg1;
    } else if (arg1 !== null && typeof arg1 === "object" && arg1._type === "Vdom") {
        children = [arg1];
    } else if (arg1 !== null && typeof arg1 === "object") {
        attributes = arg1;
    } else {
        throw new Error(`Incorrect arguments passed to v(${selector}`);
    }

    if (typeof arg2 === "string" || typeof arg2 === "function") {
        children = [arg2];
    } else if (arg2 instanceof Array) {
        children = arg2;
    }

    return v_impl(selector, attributes, children);
}

function v_impl(selector: string, attributes: CustomAttr & Attributes, children: Child[]): Vdom {

    // Create the vdom
    const vdom_node: VdomNode = {
        _type: "VdomNode",
        tag: find_tag(selector),
        id: find_id(selector),
        classes: find_classes(selector),
        attributes: {...attributes},
        children: []
    };

    const vdom: Vdom = {
        _type: "Vdom",
        parent: null,
        elem: null,
        value: vdom_node,
        node: vdom_node,
    };

    // Add the children in
    vdom_node.children = children.filter(child =>
        child !== null && child !== undefined && child !== false && child !== true
    ).map(child => {
        if (child === null || child === undefined || child === false || child === true) {
            throw new Error("Filtering doesn't work apparantly.")
        }

        // String and function children need a vdom manually created 
        // since v() wasn't called on them
        if (typeof child === "string" || typeof child === "function") {
            return {
                _type: "Vdom",
                parent: null,
                elem: null,
                value: child,
                node: typeof child === "function"
                    ? null
                    : child
            } as Vdom;

        // If a vdom was created through v(), just bind the parent
        }  else {
            child.parent = vdom;
            return child;
        }
    });

    return vdom;
}

function find_tag(selector: string) {
    const matches = selector.match(/^([\w-]+)(\.|#)?.*/);
    if (matches === null) {
        return "div";
    }

    if (matches.length < 2) {
        throw new Error(`Invalid selector: ${selector}`);
    }

    return matches[1];
}

function find_id(selector: string) {
    const matches = selector.match(/#([\w-]+)/);
    if (matches === null) {
        return undefined;
    }

    if (matches.length !== 2) {
        throw new Error(`Invalid selector: ${selector}`);
    }

    return matches[1];
}

function find_classes(selector: string) {
    const matches = selector.match(/\.([\w-]+)*/g);

    if (matches === null) {
        return [];
    }

    return matches.map(match => match.slice(1));
}

