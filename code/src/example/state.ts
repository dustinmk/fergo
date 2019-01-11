import { Vdom, Props, v } from "src/vdom";
import {mount, redraw} from "src/index";
import faker from "faker";

interface CardProps extends Props {
    state: {toggle: boolean},
    name: string
}

const card_generator = (_: Vdom, props: CardProps) => {
    return v("div", [
        v("p", `Card ${props.name}`),
        v("button", {
            onclick: () => props.state.toggle = !props.state.toggle
        }, "Toggle"),
        props.state.toggle && v("p", "enabled")
    ]);
}

// TODO: Bug with unkeyed elements - "enabled" appears twice on a toggle edge
// TODO: props, key, state should be parts of attributes
// TODO: functional components should have keys to match state with
const card = (name: string) => v(card_generator, {name, state: {toggle: true}})

const generate_list = () => {
    const list: string[] = [];
    for (let i = 0; i < 40; ++i) {
        list.push(`${faker.name.firstName()} ${faker.name.lastName()}`)
    }
    return list;
}

let name_list = generate_list();

const root = v(() => v("div", [
    v("h1", "State example"),
    v("button", {onclick: () => name_list = generate_list()}, "generate"),
    v("ul", name_list.map((name) => card(name)))
]))

setInterval(() => {
    name_list = generate_list();
    redraw(root);
}, 4000)

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
