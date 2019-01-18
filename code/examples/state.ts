import {UserVdom, v } from "../src/vdom";
import {mount} from "../src/index";
import faker from "faker";

interface CardProps {
    name: string;
}

interface CardState {
    toggle: boolean;
}

const card_generator = (vdom: UserVdom<CardProps, CardState>) => {
    return v("div", [
        v("p", `Card ${vdom.props.name}`),
        v("button", {
            onclick: () => vdom.state.toggle = !vdom.state.toggle
        }, "Toggle"),
        vdom.state.toggle && v("p", "enabled")
    ]);
}

const card = (name: string) => v(card_generator, {props: {name}, state: {toggle: true}, key: name})

const generate_list = () => {
    const list: string[] = [];
    for (let i = 0; i < 3; ++i) {
        list.push(`${faker.name.firstName()} ${faker.name.lastName()}`)
    }
    return list;
}

let name_list = generate_list();

const root = v(() => v("div", [
    v("h1", "State example"),
    v("button", {onclick: () => name_list = faker.helpers.shuffle(name_list)}, "generate"),
    v("ul", name_list.map((name) => card(name)))
]))

// setInterval(() => {
//     name_list = faker.helpers.shuffle(name_list);
//     redraw(root);
// }, 4000)

const root_elem = document.getElementById("root");
if (root_elem === null) {
    throw Error("root div not found in HTML");
}
mount(root_elem, root);

// TODO: Article - functional components: explain pruning up, pruning down, pruning with props, state, keys
// Provide reasons why these behaviours are necessary and what would happen without them
// State: consider a list of card components where the user can toggle the comments on or off
//      the state can be stored outside of the v() calls, on the vdom, or a constructor can be called as needed
// Pruning with props: if a parent redraws, the children generators will be called. Unless they handle
//      their memoization otherwise, they will be regenerated unecessarily


// Dependency injection into a component factory
const di_example = (api_service: {load: () => string[]) => {
    const generator = (vdom: UserVdom<{}, {values: string[]}>) => {
        if (vdom.state === undefined) {
            vdom.state = {values: []};
        }

        return v("button", {onclick: () => vdom.state.values = api_service.load()}, "Load");
    }

    return () => v(generator, {})
}

// Create factory with `const example_factory = di_example()`
// Components can create instances with `v("div", [example_factory()])`
// Can also just pass data as props