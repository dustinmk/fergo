import {mount, v, Vdom} from "minim/index";

import todo from "./examples/todo-example";
import pubsub from "./examples/pubsub-example";
import state from "./examples/state-example";
import reactive from "./examples/reactive-example";
import hoc from "./examples/hoc-example";

const examples: {[index: string]: () => Vdom } =  {
    "Todo": todo,
    "PubSub": pubsub,
    "State": state,
    "Reactive": reactive,
    "HOC": hoc
};

const root = document.getElementById("root");
if (root === null) {
    throw new Error("Could not find root element")
}

mount(root, () => v("div", [
    v("h1", "Examples"),
    ...Object.keys(examples).map(name => v("span", [
        v("a", {href: `./index.html?component=${name}`}, `${name}`),
        v("p", {style: {"display": "inline"}}, "\u00a0")
    ])),
    v("hr"),
    selectComponent()
]))

// Basic routing not using history API so you can run it directly on the 
// filesystem without a server
function selectComponent() {
    // Map query parameters
    const query = window.location.search.substring(1);
    const option_strings = query.split("&");
    const options: {[index: string]: string} = {};
    for (const option of option_strings) {
        const [key, value] = option.split("=");
        options[key] = value;
    }

    // Route on ?component={name}
    if (examples[options.component] !== undefined) {
        return examples[options.component]();
    } else if (options.component !== undefined) {
        return v("p", `Could not find component ${options.component}`)
    }

    return null;
}