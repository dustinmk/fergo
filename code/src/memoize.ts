import {Vdom, v} from "./vdom";

/*
If a component generates a deep or complex vdom instance,
it might be faster to compare the state and arguments that create the
vdom rather than the vdom itself. Components have the option
of returning the same vdom instance on calls to the generator to
prevent a redraw on it when the parent redraws. If the same instance
isn't returned, the new vdom will be compared with the old in a
child redraw even if it is the same.

The following illustrates the memoization process, including
eliminating redraws when the new props match the old ones

let inst = draw();
let state = 1;
let current_props = "first";
function draw() {
    return v("p", {
        onclick: () => state = 1 - state
     }, `${current_props} ${state}`);
}

export const Component = (props: string) => () => {
    if (props !== current_props) {
        current_props = props;
        inst = draw();
    }
    return inst;
}

v("div", [Component("new text")])
*/

export function memoized<PropType>(
    component: (props: PropType) => () => Vdom,
    shouldRedraw: (old_props: PropType, new_props: PropType) => boolean
        = (old_props, new_props) => old_props !== new_props
) {
    let old_props: any = undefined;
    let instance: Vdom | null = null;

    return (props: PropType) => () => {
        // If redraw() is called inside, shouldRedraw() will receive identical props,
        // so state can be compared internally or ignored
        // If redraw() is called above and the props are the same, then the same instance
        // as before is returned and the redraw() is pruned. Otherwise, the component is
        // passed the new props and the new instance is returned.
        if (shouldRedraw(old_props, props) || instance === null) {
            instance = component(props)();
        }
        return instance;
    }
}

/**
const Todo = (todo: string) => () => v("p", todo);
v("div", [memoized(Todo, (o, n) => o !== n)("new string")])
*/

// No need to memoize state since component controls when it redraws due to state change
