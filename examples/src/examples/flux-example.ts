import {v, Vdom, VdomFunctional, redraw} from "minim/index";

export default () => {
    
    interface Action<PayloadType> {
        type: string,
        payload: PayloadType
    }

    type RootAction = Action<any>;

    interface RootState {
        text: string;
        count: number;
    }

    let store: RootState = {
        text: "",
        count: 0
    };

    // If using immutable state, can replace shouldUpdate on all connected vdoms with (o, n) => o !== n
    const connect = <StorePropType extends object, DirectPropType extends object>(
        map: (state: RootState) => StorePropType,
        component: (vdom: VdomFunctional<StorePropType & DirectPropType>) => Vdom
    ) => {
        return (vdom: VdomFunctional<DirectPropType>) => {
            if (vdom.attributes.oninit === undefined) {
                vdom.attributes.oninit = (v) => bound_vdoms.add(v);
                vdom.attributes.onremove = (v) => bound_vdoms.delete(v);
            }
            return v(component, {props: {...vdom.props, ...map(store)}});
        }
    }

    const bound_vdoms: Set<VdomFunctional<any, any>> = new Set();
    const dispatch = <PayloadType>(action: Action<PayloadType>) => {
        store = reducer(store, action);
        for(const vdom of bound_vdoms) {
            redraw(vdom);   // shouldUpdate will cut the redraw short if the state hasn't changed
        }
    }

    const reducer = (state: RootState, action: RootAction) => {
        switch(action.type) {
            case "INPUT":
                return {...state, text: action.payload};
            case "COUNT":
                return {...state, count: action.payload};
        }

        return state;
    }

    // TODO: vdom that fired the event will redraw twice because of implicit redraw call on event handler
    const count_child = connect<{count: number}, {name: string}>(root => ({count: root.count}), (vdom) =>
        v("p", `${vdom.props.count} ${vdom.props.name}`));

    const button_child = connect<{count: number}, {name: string}>(root => ({count: root.count}), (vdom) =>
        v("button", {
            onclick: () => dispatch({type: "COUNT", payload: vdom.props.count + 1})
        }, `inc: ${vdom.props.name}`));

    const view = connect(root => ({text: root.text}), (vdom) => v("div", [
        v("input", {
            value: vdom.props.text,
            oninput: (event: Event) => dispatch({type: "INPUT", payload: (<HTMLInputElement>event.target).value})
        }),
        v("p", vdom.props.text),
        v(count_child, {props: {name: "steve"}}),
        v(button_child, {props: {name: "bob"}})
    ]))

    return v(view);
}

