import {VdomFunctional, Vdom} from "./vdom";

// HOC to wrap generator: initializeWith((vdom) => ..., {init_state})
export const initializeWith = <PropsType, StateType>(
    init: {
        state: () => StateType,
        shouldUpdate?: (old_props: PropsType, new_props: PropsType) => boolean,
        oninit?: (vdom: VdomFunctional<PropsType, StateType>) => void,
        onremove?: (vdom: VdomFunctional<PropsType, StateType>) => void
    },
    generator: (vdom: VdomFunctional<PropsType, StateType>) => Vdom
) => {
    return (vdom: VdomFunctional<PropsType, StateType>) => {
        if (vdom.state === undefined || vdom.state === null) {
            vdom.state = init.state();
            vdom.attributes = {
                shouldUpdate : init.shouldUpdate,
                oninit: init.oninit,
                onremove: init.onremove
            }
        }

        return generator(vdom);
    }
}