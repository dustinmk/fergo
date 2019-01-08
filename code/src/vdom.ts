// TODO: JSX compatible variant
// TODO: oninit(), onremove() hooks

export interface VdomBase {
    parent: Vdom | null;
}

export interface VdomNode extends VdomBase {
    _type: "VdomNode";
    tag: string;
    id: string | undefined;
    attributes: CustomAttr & Attributes;
    classes: string[];
    children: Vdom[];
}

export interface VdomFunctional extends VdomBase {
    _type: "VdomFunctional";
    generator: VdomGenerator;
    instance: Vdom | null;
    elem: Node | null;
}

export interface VdomText extends VdomBase {
    _type: "VdomText";
    text: string;
}

export interface VdomNull extends VdomBase {
    _type: "VdomNull";
}

export type Vdom = VdomNode | VdomFunctional | VdomText | VdomNull;

interface Attributes {
    _type?: "Attributes";
    key?: string;
}

interface CustomAttr {
    [index: string]: any;
}

export type VdomGenerator = (vdom: Vdom) => Vdom;

export type Child = Vdom | VdomGenerator | string | null | boolean;

// TODO: Make string child a different custom attribute, not a child
export function v(selector: VdomGenerator): Vdom;
export function v(selector: string): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes): Vdom;
export function v(selector: string, children: Child[]): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes, children: Child[]): Vdom;
export function v(selector: string, children: Child): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes, children: Child): Vdom;
export function v(selector: string | VdomGenerator, arg1?: CustomAttr & Attributes | Child[] | Child, arg2?: Child[] | Child): Vdom {

    // Shortcut if a functional component
    if(typeof selector === "function") {
        return {
            _type: "VdomFunctional",
            parent: null,
            elem: null,
            generator: selector,
            instance: null
        } as VdomFunctional
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
    } else if (arg1 !== null && typeof arg1 === "object" && arg1._type === "VdomNode") {
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
    const vdom: VdomNode = {
        _type: "VdomNode",
        parent: null,
        tag: find_tag(selector),
        id: find_id(selector),
        classes: find_classes(selector),
        attributes: {...attributes},
        children: []
    };

    // Add the children in
    vdom.children = children.map(child => {

        // Use VdomNull as a placeholder for conditional nodes
        if (child === null || child === undefined || child === false || child === true) {
            return {
                _type: "VdomNull",
                parent: vdom,
            } as VdomNull;
        }

        else if (typeof child === "string") {
            return {
                _type: "VdomText",
                parent: vdom,
                text: child
            } as VdomText;

        } else if(typeof child === "function") {
            return {
                _type: "VdomFunctional",
                parent: vdom,
                elem: null,
                generator: child,
                instance: null
            } as VdomFunctional;

        // If a vdom was already created through v(), just bind the parent
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

