import {ComponentAttributes, Vdom} from "./vdom";

// HOC to wrap generator: initializeWith((vdom) => ..., {init_state})
export const initializeWith = <PropsType, StateType>(
    init: {
        state: () => StateType,
        shouldUpdate?: (old_props: PropsType, new_props: PropsType) => boolean,
        oninit?: (vdom: ComponentAttributes<PropsType, StateType>) => void,
        onremove?: (vdom: ComponentAttributes<PropsType, StateType>) => void
    },
    generator: (vdom: ComponentAttributes<PropsType, StateType>) => Vdom
) => {
    return (vdom: ComponentAttributes<PropsType, StateType>) => {
        if (vdom.state === undefined || vdom.state === null) {
            vdom.state = init.state();
            vdom.shouldUpdate = init.shouldUpdate;
            vdom.oninit = init.oninit;
            vdom.onremove = init.onremove;
        }

        return generator(vdom);
    }
}