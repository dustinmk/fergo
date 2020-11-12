// TODO: JSX compatible variant
import {
    T_VDOM_NODE,
    T_VDOM_FRAGMENT,
    T_VDOM_TEXT,
    T_VDOM_FUNCTIONAL,
    VDOM_NODE,
    VDOM_FRAGMENT,
    VDOM_TEXT,
    VDOM_FUNCTIONAL,
} from "./constants";

interface VdomBase {
    node_type: T_VDOM_NODE | T_VDOM_FRAGMENT | T_VDOM_TEXT | T_VDOM_FUNCTIONAL;
    mounted: boolean;
    elem: Node | null;
    value: string | VdomGenerator<any, any> | null;
    key: any;
    attributes?: VdomFunctionalHooks<any, any> | (CustomAttr & Attributes);
    classes: string;
    children: Array<Vdom | null>;
    namespace: string | null;
    instance: Vdom | null;
    state: any;
    props: any;
    binding: BindPoint
}

export interface VdomFunctional<PropType = {}, StateType = {}>
    extends VdomBase
{
    node_type: T_VDOM_FUNCTIONAL;
    value: VdomGenerator<PropType, StateType>;
    instance: Vdom | null;
    props: PropType;
    state: StateType;
    attributes: VdomFunctionalHooks<PropType, StateType>;

    // A child functional component can have many instances generated before its
    // parent generates again. Each instance may have passed itself to event handlers.
    // When the functional component is regenerated, the redraw() call should be applied
    // to the new version, even if it is called on the instance of the old version.
    // Otherwise, each previous instance must have its parent set. This bindpoint is
    // shared across all instances of a functional component and it has its binding
    // reset to the current node for every redraw()

    binding: BindPoint
}

export interface BindPoint {
    bindpoint: VdomFunctional<any, any> | null
}

export interface VdomFunctionalHooks<PropType, StateType> {
    shouldUpdate?: (old_props: PropType, new_props: PropType, state: StateType) => boolean;
    oninit?: (vdom: VdomFunctional<PropType, StateType>) => void;
    onremove?: (vdom: VdomFunctional<PropType, StateType>) => void;
}

export interface FunctionalAttributes<PropType = {}, StateType = {}> {
    node_type?: string;
    props?: PropType;
    state?: StateType;
    key?: any;
    children?: Array<Vdom | null>;
    shouldUpdate?: (old_props: PropType, new_props: PropType, state: StateType) => boolean;
    oninit?: (vdom: VdomFunctional<PropType, StateType>) => void;
    onremove?: (vdom: VdomFunctional<PropType, StateType>) => void;
}

export type VdomFunctionalNotInit<PropType, StateType = {}> =
    VdomFunctional<PropType, StateType> 
    & { state: StateType | null };

export interface VdomNode extends VdomBase {
    node_type: T_VDOM_NODE;
    value: string;
    attributes: CustomAttr & Attributes;
    classes: string;
    children: Array<Vdom | null>;
    namespace: string | null;
}

export interface Style {
    [index: string]: string;
}

export interface VdomFragment extends VdomBase {
    node_type: T_VDOM_FRAGMENT;
    children: Array<Vdom | null>;
}

export interface VdomText extends VdomBase {
    node_type: T_VDOM_TEXT;
    value: string;
}

export type Vdom = VdomNode | VdomFragment | VdomFunctional<any, any> | VdomText;

export interface Attributes {
    node_type?: undefined;
    key?: any;
    style?: Style;
    namespace?: string;
    [index: string]: any;
    oninit?: (vdom: VdomNode) => void;
    onremove?: (vdom: VdomNode) => void;
}

interface CustomAttr {
    [index: string]: any;
}

export type VdomGenerator<PropType, StateType>
    = (vdom: VdomFunctionalNotInit<PropType, StateType>) => Vdom;

type ChildBase = Vdom | VdomGenerator<any, any> | string | null | boolean;
interface ChildArray {
    node_type?: undefined;
    [index: number]: ChildBase | ChildArray;
}
type Child = ChildBase | ChildArray;

export function v(selector: string): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes): Vdom;
export function v(selector: string, children: Child): Vdom;
export function v(selector: string, attributes: CustomAttr & Attributes, children: Child): Vdom;
export function v<PropType, StateType>(
    selector: VdomGenerator<PropType, StateType>,
    props?: FunctionalAttributes<PropType, StateType>,
    children?: Child
): Vdom;
export function v<PropType, StateType>(
    selector: string | VdomGenerator<PropType, StateType>,
    arg1?: CustomAttr & Attributes | Child | FunctionalAttributes<PropType, StateType>,
    arg2?: Child
): Vdom {

    // Shortcut if a functional component
    if(typeof selector === "function") {
        const attr = isFunctionalAttributes(arg1)
            ? arg1
            : {} as FunctionalAttributes<PropType, StateType>;
        return makeVdomFunctional(
            selector,
            attr.state === undefined ? null : attr.state,
            attr.props,
            attr.key === undefined ? null : attr.key,
            arg2 === undefined
                ? attr.children === undefined
                    ? []
                    : attr.children
                : Array.isArray(arg2)
                    ? arg2
                    : [arg2],
            attr.shouldUpdate,
            attr.oninit,
            attr.onremove
        );
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
    } else if (arg1 !== null && typeof arg1 === "object" && arg1.node_type !== undefined && (arg1.node_type === VDOM_NODE || arg1.node_type === VDOM_FUNCTIONAL)) {
        children = [arg1 as VdomNode];
    } else if (arg1 !== null && typeof arg1 === "object") {
        attributes = arg1;
    } else if (arg1 !== undefined) {
        throw new Error(`Incorrect arguments passed to v(${selector}`);
    }

    if (arg2 instanceof Array) {
        children = arg2;
    } else if (typeof arg2 === "string" || typeof arg2 === "function" || (typeof arg2 === "object" && arg2 !== null && arg2.node_type !== undefined)) {
        children = [arg2];
    }

    return makeVdomNode(selector, attributes, children) as Vdom;
}

function isFunctionalAttributes<PropType, StateType>(
    arg?: CustomAttr & Attributes | Child[] | Child | FunctionalAttributes<PropType, StateType>
): arg is FunctionalAttributes<PropType, StateType> {
    return arg !== undefined
        && typeof arg === "object"
        && !Array.isArray(arg)
        && arg !== null
}

// TODO: Child nodes can stay strings if all the children are strings, otherwise need a node
// TODO: Fragments can stay arrays always
const childToVdom = (child: Child) => {

    // Use VdomNull as a placeholder for conditional nodes
    if (child === null || child === undefined || child === false || child === true) {
        return null;
    }

    else if (typeof child === "string") {
        const v = makeVdomText(child);
        v.mounted = true;
        return v;

    } else if(typeof child === "function") {
        const v = makeVdomFunctional(child, null, null, null, []);
        v.mounted = true;
        return v;

    } else if (Array.isArray(child)) {
        const v = makeVdomFragment(child);
        v.mounted = true;
        return v;

    // If a vdom was already created through v(), just bind the parent
    // Children must be unique so they can store state and elems
    // Children are unique if parent not set since it hasn't been bound to a vdom tree yet
    // On a redraw, the parent might be set from the old location and the vdom used only
    // once in the new one. It is hard to determine if this is the case is the parent is set,
    // and reusing instantiated vdoms is an uncommon use case, so copying is the best
    // course of action.
    }  else if (child.node_type !== undefined) {
        if (child.node_type !== VDOM_FUNCTIONAL) {
            if (child.mounted || child.elem !== null) return copyVdom(child);
            else {
                child.mounted = true;
                return child;
            }

        } else {
            // The user may store a reference to the original child and call redraw()
            // on it. However, it might be replaced if its parent is redrawn so the user's
            // reference is not longer in the vdom tree. Use vdom binding like in event
            // handlers to resolve this. redraw() will redraw on the bound vdom. All
            // copies of the original vdom instance will share the same binding instance,
            // so they all point to the current copy.

            // TODO: Prevent copy if not needed
            // State bug if done with cancelling on mounted
            const new_child: VdomFunctional<any, any> = copyV(child) as VdomFunctional<any, any>;
            new_child.mounted = true;
            child.binding.bindpoint = new_child;
            child.mounted = true;
            child.elem = null;  // Safeguard against memory leaks
            child.instance = null;
            new_child.binding = {bindpoint: new_child};
            if (child.state !== undefined && child.state !== null && typeof child.state === "object") {
                child.state = {...child.state}
            }
            return new_child;
        }
    } else if (child.node_type !== undefined) {
        return child;
    } else {
        throw new Error("child.node_type undefined")
    }
}

const copyVdom = (vdom: Vdom | null) => {
    if (vdom === null) {
        return null;
    }

    if (!vdom.mounted) {
        vdom.mounted = true;
        return vdom;
    }

    const copy = copyV(vdom);
    copy.mounted = true;

    if (copy.node_type === VDOM_NODE) {
        copy.children = copy.children.map(child => copyVdom(child) as Vdom | null)
    }

    return copy;
}

interface SplitSelector {
    id: string | undefined;
    tag: string;
    class_acc: string[];
    classes: string;
}

enum SelectorState {
    TAG,
    CLASS,
    ID
}

const placeToken = (token: string, state: SelectorState, split_selector: SplitSelector) => {
    if (token.length === 0) {
        return;
    }

    if (state === SelectorState.ID) {
        split_selector.id = token;
    } else if (state === SelectorState.TAG) {
        split_selector.tag = token;
    } else {
        split_selector.class_acc.push(token);
    }
}

export const splitSelector = (selector: string) => {
    let index = 0;

    const split_selector = {
        id: undefined,
        tag: "div",
        class_acc: [],
        classes: ""
    }

    // This manual parse is much faster than using regex
    let token_start = 0;
    let state: SelectorState = SelectorState.TAG;
    while (index < selector.length) {
        const c = selector[index];
        if (c === ".") {
            placeToken(selector.substring(token_start, index), state, split_selector);
            state = SelectorState.CLASS;
            token_start = index + 1;
        } else if (c === "#") {
            placeToken(selector.substring(token_start, index), state, split_selector);
            state = SelectorState.ID;
            token_start = index + 1;
        }
        ++index;
    }
    placeToken(selector.substring(token_start, index), state, split_selector);

    split_selector.classes = split_selector.class_acc.join(" ");
    return split_selector;
}

const makeVdomFunctional = <PropType, StateType>(
    generator: VdomGenerator<PropType, StateType>,
    state: StateType | null,
    props: PropType | undefined,
    key: any,
    children: Child[],
    shouldUpdate?: (old_props: PropType, new_props: PropType, state: StateType) => boolean,
    oninit?: (vdom: VdomFunctional<PropType, StateType>) => void,
    onremove?: (vdom: VdomFunctional<PropType, StateType>) => void,
) => {
    const v = new V(
        VDOM_FUNCTIONAL,
        generator,
        key,
        {
            shouldUpdate: shouldUpdate,
            oninit: oninit,
            onremove: onremove
        },
        "",
        children,
        null,
        state,
        props
    )

    v.binding.bindpoint = v as VdomFunctional;

    return v as VdomFunctional<PropType, StateType>;
}

const makeVdomNode = (selector: string, attributes: Attributes, children: Child[]) => {
    const {id, tag, classes} = splitSelector(selector);
    return new V(
        VDOM_NODE,
        tag,
        attributes.key === undefined ? null : attributes.key,
        id === undefined ? attributes : {...attributes, id},
        classes,
        children,
        attributes.namespace === undefined ? null : attributes.namespace,
        null,
        null
    )
}

const makeVdomText = (text: string) => {
    return new V(
        VDOM_TEXT,
        text,
        null,
        {},
        "",
        [],
        null,
        null,
        null
    ) as Vdom
}

const makeVdomFragment = (children: Array<Child>) => {
    return new V(
        VDOM_FRAGMENT,
        null,
        null,
        {},
        "",
        children,
        null,
        null,
        null
    );
}

// TODO: Use constructor argument binding
class V {
    node_type: T_VDOM_NODE | T_VDOM_FRAGMENT | T_VDOM_TEXT | T_VDOM_FUNCTIONAL;
    mounted: boolean;
    elem: Node | null;
    value: string | VdomGenerator<any, any> | null;
    key: any;
    attributes?: VdomFunctionalHooks<any, any> | (CustomAttr & Attributes);
    classes: string;
    children: Array<Vdom | null>;
    namespace: string | null;
    instance: Vdom | null;
    state: any;
    props: any;
    binding: BindPoint;

    constructor(
        node_type: T_VDOM_NODE | T_VDOM_FRAGMENT | T_VDOM_TEXT | T_VDOM_FUNCTIONAL,
        value: string | VdomGenerator<any, any> | null,
        key: any,
        attributes: any,
        classes: string,
        children: Child[],
        namespace: null | string,
        state: any,
        props: any,
    ) {
        this.node_type = node_type;
        this.mounted = false;
        this.elem = null;
        this.value = value;
        this.key = key;
        this.attributes = attributes;
        this.classes = classes;
        this.children = children.map(child => childToVdom(child)) as Array<Vdom | null>; 
        this.namespace = namespace;
        this.instance = null;
        this.state = state;
        this.props = props;
        this.binding = {bindpoint: null}
    }
}

const copyV = (v: V) => {
    const n = new V(
        v.node_type,
        v.value,
        v.key,
        v.attributes,
        v.classes,
        v.children,
        v.namespace,
        v.state,
        v.props);
    n.elem = v.elem;
    n.instance = v.instance;
    n.binding = v.binding;
    return n;
}

export const getElem = (vdom: Vdom | null): Node | null => {
    if (vdom === null) {
        return null;
    } else if (vdom.node_type === VDOM_FUNCTIONAL) {
        while (vdom !== null && vdom.node_type === VDOM_FUNCTIONAL) {
            vdom = vdom.instance;
        }
        return vdom === null ? null : vdom.elem;
    } else {
        return vdom.elem;
    }
}