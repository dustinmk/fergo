import {ComponentAttributes, Vdom} from "./vdom";

// Use inside generator: (vdom) => { initislizeState(vdom, {init_state})l return v(...); }
export const initializeState = <StateType>(vdom: ComponentAttributes<any, StateType>, init_state: StateType) => {
    if (vdom.state === undefined || vdom.state === null) {
        vdom.state = init_state;
    }
}

// HOC to wrap generator: initializeWith((vdom) => ..., {init_state})
export const initializeWith = <PropsType, StateType>(generator: (vdom: ComponentAttributes<PropsType, StateType>) => Vdom, init_state: StateType) => {
    return (vdom: ComponentAttributes<PropsType, StateType>) => {
        if (vdom.state === undefined || vdom.state === null) {
            vdom.state = init_state;
        }

        return generator(vdom);
    }
}