// TODO: JSX compatible variant

interface VdomBase {
    parent: Vdom | null;
}

export interface VdomFunctional<PropType, StateType>
    extends VdomBase, ComponentAttributes<PropType, StateType>
{
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

export interface ComponentAttributes<PropType = {}, StateType = {}> {
    _type?: "VdomFunctional";
    props: PropType;
    state: StateType;
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
    _type: "VdomNode";
    tag: string;
    id: string | undefined;
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
    _type: "VdomFragment";
    children: Vdom[];
}

export interface VdomText extends VdomBase {
    _type: "VdomText";
    text: string;
}

export interface VdomNull extends VdomBase {
    _type: "VdomNull";
}

export type Vdom = VdomNode | VdomFragment | VdomFunctional<any, any> | VdomText | VdomNull;

export interface Attributes {
    _type?: "Attributes";
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
    props?: VdomFunctionalAttributes<PropType, StateType>
): Vdom;
export function v<PropType, StateType>(
    selector: string | VdomGenerator<PropType, StateType>,
    arg1?: CustomAttr & Attributes | Child[] | Child | VdomFunctionalAttributes<PropType, StateType>,
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
                {props: null, state: null}, // Default if not specified
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
        _type: "VdomNode",
        parent: null,
        tag: find_tag(selector),
        id: find_id(selector),
        classes: find_classes(selector),
        attributes: {...attributes},
        children: []
    };

    // Add the children in
    vdom.children = children.map(child => childToVdom(child, vdom));

    return vdom;
}

const childToVdom = (child: Child, parent: Vdom) => {

    // Use VdomNull as a placeholder for conditional nodes
    if (child === null || child === undefined || child === false || child === true) {
        return {
            _type: "VdomNull",
            parent: parent,
        } as VdomNull;
    }

    else if (typeof child === "string") {
        return {
            _type: "VdomText",
            parent: parent,
            text: child
        } as VdomText;

    } else if(typeof child === "function") {
        const functional_vdom = {
            _type: "VdomFunctional",
            parent: parent,
            elem: null,
            generator: child,
            instance: null,
            state: null,
            props: null,
        };
        
        return Object.assign(functional_vdom, {bindpoint: {
            binding: (functional_vdom as unknown) as VdomFunctional<any, any>
        }}) as VdomFunctional<any, any>;
    } else if (Array.isArray(child)) {
        const vdom: VdomFragment = {
            _type: "VdomFragment",
            parent: parent,
            children: [],
        };

        vdom.children = child.map(fragment_child => childToVdom(fragment_child, vdom));
        return vdom;

    // If a vdom was already created through v(), just bind the parent
    }  else if (child._type !== undefined) {
        child.parent = parent;
        return child;
    } else {
        throw new Error("Invalid child type.");
    }
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

