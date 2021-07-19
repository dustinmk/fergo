import {v, Vdom, redraw} from "minim/index";

// Svelte-like await keyword
// TODO: clean up and test

const vAwait = (
    promise: Promise<any>,
    waiting_component: () => Vdom,
    resolved_component: (value: any) => Vdom,
    catch_component?: (err: any) => Vdom
) => {
    return (vdom: Vdom) => {
        if (vdom.state === undefined) {
            vdom.state = {resolved: "no", error: null, value: null};
        }

        promise
            .then(value => {
                vdom.state.value = value;
                vdom.state.resolved = "resolved";
                redraw(vdom);
            })
            .catch(err => {
                vdom.state.error = err;
                vdom.state.resolved = "error";
                redraw(vdom);
            });
        
        if(vdom.state.resolved === "no") {
            return waiting_component();
        } else if (vdom.state.resovled == "resolved") {
            return resolved_component(vdom.state.value);
        } else if (catch_component !== undefined) {
            return catch_component(vdom.state.error);
        }

        return null;
    }
}

export default () => {
    const timer = new Promise(resolve => {
        setTimeout(() => resolve());
    });

    return vAwait(timer,
        () => v("p", "waiting..."),
        () => v("p", "resolved")
    );
}