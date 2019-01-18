import {mount, v, Vdom} from "../src";

import todo from "./todo";
import closure from "./closure";

const examples: {[index: string]: () => Vdom } =  {
    "Todo": todo,
    "Closure": closure
};

const root = document.getElementById("root");
if (root === null) {
    throw new Error("Could not find root element")
}

mount(root, () => v("div", [
    v("h1", "Examples"),
    ...Object.keys(examples).map(name => v("span", [
        v("a", {href: `./index.html?component=${name}`}, `${name}`),
        v("p", {style: "display:inline"}, "\ufeff")
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