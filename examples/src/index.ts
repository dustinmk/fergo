import {mount, v, Vdom} from "fergo/index";

import todo from "./examples/todo-example";
import await_example from "./examples/await-example";
import pubsub from "./examples/pubsub-example";
import state from "./examples/state-example";
import reactive from "./examples/reactive-example";
import hoc from "./examples/hoc-example";
import svg from "./examples/svg-example";
import modal from "./examples/modal-example";
import flux from "./examples/flux-example";
import calendar from "./examples/calendar-example";
import animation from "./examples/animation-example";
import depinj from "./examples/dependency-injection-example";

const examples: {[index: string]: () => Vdom } =  {
    "Todo": todo,
    "Await": await_example,
    "PubSub": pubsub,
    "State": state,
    "Reactive": reactive,
    "HOC": hoc,
    "SVG": svg,
    "Modal": modal,
    "Flux": flux,
    "Calendar": calendar,
    "Animation": animation,
    "Dependency_Injection": depinj
};

const root = document.getElementById("root");
if (root === null) {
    throw new Error("Could not find root element")
}

mount(root, () => v("div", [
    v("h1", "Examples"),
    v("div", {class: "nav-pane"}, [
        v("span", [
            v("a", {href: "/router-example.html"}, "Router")
        ]),
        ...Object.keys(examples).map(name => v("span", [
            v("a", {href: `./index.html?component=${name}`}, `${name}`)
        ])),
    ]),
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