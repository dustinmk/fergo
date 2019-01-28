// TODO: JSX compatible variant
import {
    T_VDOM_NODE,
    T_VDOM_FRAGMENT,
    T_VDOM_NULL,
    T_VDOM_TEXT,
    T_VDOM_FUNCTIONAL,
    VDOM_NODE,
    VDOM_FRAGMENT,
    VDOM_NULL,
    VDOM_TEXT,
    VDOM_FUNCTIONAL,
} from "./constants";

interface VdomBase {
    parent: Vdom | null;
    elem: Node | null;
}

export interface VdomFunctional<PropType, StateType>
    extends VdomBase, ComponentAttributes<PropType, StateType>
{
    _type: T_VDOM_FUNCTIONAL;
    generator: VdomGenerator<any, any>;
    instance: Vdom | null;

    // A child functional component can have many instances generated before its
    // parent generates again. Each instance may have passed itself to event handlers.
    // When the functional component is regenerated, the redraw() call should be applied
    // to the new version, even if it is called on the instance of the old version.
    // Otherwise, each previous instance must have its parent set. This bindpoint is
    // shared across all instances of a functional component and it has its binding
    // reset to the current node for every redraw()
    bindpoint: BindPoint;
}

export interface ComponentAttributes<PropType = {}, StateType = {}> {
    _type?: T_VDOM_FUNCTIONAL;
    props: PropType;
    state: StateType;
    children: Vdom[];
    key?: string;
    shouldUpdate?: (old_props: PropType, new_props: PropType, state: StateType) => boolean;
    oninit?: (vdom: ComponentAttributes<PropType, StateType>) => void;
    onremove?: (vdom: ComponentAttributes<PropType, StateType>) => void;
}

export type VdomFunctionalAttributes<PropType, StateType>
    = Partial<ComponentAttributes<PropType, StateType>>

export interface BindPoint {
    binding: VdomFunctional<any, any>;
}

export interface VdomNode extends VdomBase {
    _type: T_VDOM_NODE;
    tag: string;
    attributes: CustomAttr & Attributes;
    classes: ClassList;
    children: Vdom[];
}

export interface ClassList {
    [index: string]: string;
}

export interface Style {
    [index: string]: string;
}

export interface VdomFragment extends VdomBase {
    _type: T_VDOM_FRAGMENT;
    children: Vdom[];
}

export interface VdomText extends VdomBase {
    _type: T_VDOM_TEXT;
    text: string;
}

export interface VdomNull extends VdomBase {
    _type: T_VDOM_NULL;
}

export type Vdom = VdomNode | VdomFragment | VdomFunctional<any, any> | VdomText | VdomNull;

export interface Attributes {
    _type?: undefined;
    key?: string;
    style?: Style;
    [index: string]: any;
    oninit?: (vdom: Vdom, elem: Node) => void;
    onremove?: (vdom: Vdom, elem: Node) => void;
}

interface CustomAttr {
    [index: string]: any;
}

export type VdomGenerator<PropType, StateType>
    = (vdom: ComponentAttributes<PropType, StateType>) => Vdom;

type ChildBase = Vdom | VdomGenerator<any, any> | string | null | boolean;
interface ChildArray {
    _type?: undefined;
    [index: number]: ChildBase | ChildArray;
}
type Child = ChildBase | ChildArray;

export function v(selector: string): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes): Vdom;
export function v(selector: string, children: Child): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes, children: Child): Vdom;
export function v<PropType, StateType>(
    selector: VdomGenerator<PropType, StateType>,
    props?: VdomFunctionalAttributes<PropType, StateType>,
    children?: Child
): Vdom;
export function v<PropType, StateType>(
    selector: string | VdomGenerator<PropType, StateType>,
    arg1?: CustomAttr & Attributes | Child | VdomFunctionalAttributes<PropType, StateType>,
    arg2?: Child
): Vdom {

    // Shortcut if a functional component
    // TODO: Make monomorphic
    if(typeof selector === "function") {
        let vdom = {
            _type: VDOM_FUNCTIONAL,
            parent: null,
            elem: null,
            generator: selector,
            instance: null,
            state: null,
            props: null,
            children: []
        };
        const bindpoint = {bindpoint: {
            binding: (vdom as unknown) as VdomFunctional<PropType, StateType>
        }};

        if (isUserSupplied(arg1)) {
            const children = arg2 === undefined
                ? arg1.children === undefined
                    ? []
                    : arg1.children
                : Array.isArray(arg2)
                    ? arg2
                    : [arg2];

            return Object.assign(
                vdom,
                arg1,
                bindpoint,
                children
            );
        }
        return Object.assign(vdom, bindpoint) as VdomFunctional<any, any>;
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
    } else if (arg1 !== null && typeof arg1 === "object" && arg1._type !== undefined && arg1._type === VDOM_NODE) {
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

function isUserSupplied<PropType, StateType>(
    arg?: CustomAttr & Attributes | Child[] | Child | VdomFunctionalAttributes<PropType, StateType>
): arg is VdomFunctionalAttributes<PropType, StateType> {
    return arg !== undefined
        && typeof arg === "object"
        && !Array.isArray(arg)
        && arg !== null
        && ("key" in arg || "props" in arg || "state" in arg)
}

function v_impl(selector: string, attributes: CustomAttr & Attributes, children: Child[]): Vdom {

    // Create the vdom
    const vdom: VdomNode = {
        _type: VDOM_NODE,
        parent: null,
        tag: find_tag(selector),
        classes: find_classes(selector),
        attributes: {...attributes, id: find_id(selector)},
        children: [],
        elem: null
    };

    // Add the children in
    vdom.children = children.map(child => childToVdom(child, vdom));

    return vdom;
}

const childToVdom = (child: Child, parent: Vdom) => {

    // Use VdomNull as a placeholder for conditional nodes
    if (child === null || child === undefined || child === false || child === true) {
        return {
            _type: VDOM_NULL,
            parent: parent,
            elem: null
        } as VdomNull;
    }

    else if (typeof child === "string") {
        return {
            _type: VDOM_TEXT,
            parent: parent,
            text: child,
            elem: null
        } as VdomText;

    } else if(typeof child === "function") {
        const functional_vdom = {
            _type: VDOM_FUNCTIONAL,
            parent: parent,
            elem: null,
            generator: child,
            instance: null,
            state: null,
            initial_state: null,
            props: null,
            children: []
        };
        
        return Object.assign(functional_vdom, {bindpoint: {
            binding: (functional_vdom as unknown) as VdomFunctional<any, any>
        }}) as VdomFunctional<any, any>;

    } else if (Array.isArray(child)) {
        const vdom: VdomFragment = {
            _type: VDOM_FRAGMENT,
            parent: parent,
            children: [],
            elem: null,
        };

        vdom.children = child.map(fragment_child => childToVdom(fragment_child, vdom));
        return vdom;

    // If a vdom was already created through v(), just bind the parent
    // Children must be unique so they can store state and elems
    // Children are unique if parent not set since it hasn't been bound to a vdom tree yet
    // On a redraw, the parent might be set from the old location and the vdom used only
    // once in the new one. It is hard to determine if this is the case is the parent is set,
    // and reusing instantiated vdoms is an uncommon use case, so copying is the best
    // course of action.
    }  else if (child._type !== undefined) {
        if (child._type !== VDOM_FUNCTIONAL) {
            return copyVdom(child, parent);

        } else {
            // The user may store a reference to the original child and call redraw()
            // on it. However, it might be replaced if its parent is redrawn so the user's
            // reference is not longer in the vdom tree. Use vdom binding like in event
            // handlers to resolve this. redraw() will redraw on the bound vdom. All
            // copies of the original vdom instance will share the same binding instance,
            // so they all point to the current copy.
            const new_child: VdomFunctional<any, any> = {...child};
            new_child.parent = parent;
            child.bindpoint.binding = new_child;
            child.parent = parent;
            child.elem = null;  // Safeguard against memory leaks
            child.instance = null;
            new_child.bindpoint = {binding: new_child}
            if (child.state !== undefined && child.state !== null && typeof child.state === "object") {
                child.state = {...child.state}
            }
            return new_child;
        }
    } else {
        throw new Error("Invalid child type.");
    }
}

const copyVdom = (vdom: Vdom, parent: Vdom) => {
    if (vdom.parent === null) {
        vdom.parent = parent;
        return vdom;
    }

    const copy = {
        ...vdom,
        parent
    }

    if (copy._type === VDOM_NODE) {
        copy.children = copy.children.map(child => copyVdom(child, copy))
    }

    return copy;
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

