// TODO: JSX compatible variant

export interface VdomBase {
    parent: Vdom | null;
}

export interface ClassList {
    [index: string]: string;
}

export interface VdomNode extends VdomBase {
    _type: "VdomNode";
    tag: string;
    id: string | undefined;
    attributes: CustomAttr & Attributes;
    classes: ClassList;
    children: Vdom[];
}

export interface UserVdom<PropType extends {[index: string]: any}= {}, StateType = {}> {
    _type?: "VdomFunctional";
    props: PropType;
    state: StateType;
    key?: string;
    shouldUpdate?: (old_props: PropType, new_props: PropType, state: StateType) => boolean;
    onMount?: (vdom: UserVdom<PropType, StateType>) => void;
    onUnmount?: (vdom: UserVdom<PropType, StateType>) => void;
}

export interface UserSupplied<PropType, StateType> {
    props?: PropType;
    state?: StateType;
    key?: string;
    shouldUpdate?: (old_props: PropType, new_props: PropType, state: StateType) => boolean;
    onMount?: (vdom: UserVdom<PropType, StateType>) => void;
    onUnmount?: (vdom: UserVdom<PropType, StateType>) => void;
}

export interface VdomFunctionalBase extends VdomBase {
    _type: "VdomFunctional";
    generator: VdomGenerator<any, any>;
    instance: Vdom | null;
    elem: Node | null;

    // A child functional component can have many instances generated before its
    // parent generates again. Each instance may have passed itself to event handlers.
    // When the functional component is regenerated, the redraw() call should be applied
    // to the new version, even if it is called on the instance of the old version.
    // Otherwise, each previous instance must have its parent set. This bindpoint is
    // shared across all instances of a functional component and it has its binding
    // reset to the current node for every redraw()
    bindpoint: BindPoint;
}

export type VdomFunctional<PropType extends {[index: string]: any}, StateType>
    = VdomFunctionalBase & UserVdom<PropType, StateType>;

export interface BindPoint {
    binding: VdomFunctionalBase;
}

export interface VdomText extends VdomBase {
    _type: "VdomText";
    text: string;
}

export interface VdomNull extends VdomBase {
    _type: "VdomNull";
}

export type Vdom = VdomNode | VdomFunctional<any, any> | VdomText | VdomNull;

export interface Attributes {
    _type?: "Attributes";
    key?: string;
    [index: string]: any;
    oninit?: (vdom: Vdom, elem: Node) => void;
    onremove?: (vdom: Vdom, elem: Node) => void;
}

interface CustomAttr {
    [index: string]: any;
}

export type VdomGenerator<PropType, StateType>
    = (vdom: UserVdom<PropType, StateType>) => Vdom;

export type Child = Vdom | VdomGenerator<any, any> | string | null | boolean;

// TOOD: Replace with UserSupplied<>
export function v(selector: string): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes): Vdom;
export function v(selector: string, children: Child[]): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes, children: Child[]): Vdom;
export function v(selector: string, children: Child): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes, children: Child): Vdom;
export function v<PropType, StateType>(selector: VdomGenerator<PropType, StateType>, props?: UserSupplied<PropType, StateType>): Vdom;
export function v<PropType, StateType>(
    selector: string | VdomGenerator<PropType, StateType>,
    arg1?: CustomAttr & Attributes | Child[] | Child | UserVdom<PropType, StateType>,
    arg2?: Child[] | Child
): Vdom {

    // Shortcut if a functional component
    if(typeof selector === "function") {
        let vdom = {
            _type: "VdomFunctional",
            parent: null,
            elem: null,
            generator: selector,
            instance: null
        };
        const bindpoint = {bindpoint: {
            binding: (vdom as unknown) as VdomFunctional<PropType, StateType>
        }};

        if (isUserSupplied(arg1)) {
            return Object.assign(
                vdom,
                arg1,
                bindpoint
            );
        }
        return Object.assign(vdom, bindpoint, {state: null, props: null}) as VdomFunctional<any, any>;
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
    } else if (arg1 !== null && typeof arg1 === "object" && arg1._type !== undefined && arg1._type === "VdomNode") {
        children = [arg1];
    } else if (arg1 !== null && typeof arg1 === "object") {
        attributes = arg1;
    } else if (arg1 !== undefined) {
        throw new Error(`Incorrect arguments passed to v(${selector}`);
    }

    if (typeof arg2 === "string" || typeof arg2 === "function") {
        children = [arg2];
    } else if (arg2 instanceof Array) {
        children = arg2;
    }

    return v_impl(selector, attributes, children);
}

function isUserSupplied<PropType, StateType>(arg?: CustomAttr & Attributes | Child[] | Child | UserSupplied<PropType, StateType>): arg is UserSupplied<PropType, StateType> {
    return arg !== undefined
        && typeof arg === "object"
        && !Array.isArray(arg)
        && arg !== null
        && ("key" in arg || "props" in arg || "state" in arg)
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
            const functional_vdom = {
                _type: "VdomFunctional",
                parent: vdom,
                elem: null,
                generator: child,
                instance: null,
                state: null,
                props: null,
            };
            
            return Object.assign(functional_vdom, {bindpoint: {
                binding: (functional_vdom as unknown) as VdomFunctional<any, any>
            }}) as VdomFunctional<any, any>;

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

    return matches.reduce((acc: ClassList, match) => {
        const c = match.slice(1);
        acc[c] = c;
        return acc;
    }, {});
}

