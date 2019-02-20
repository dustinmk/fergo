import {VdomFunctional, v, initializeWith} from "minim/index";
import faker from "faker";

// Card component
interface CardProps {
    name: string;
}

interface CardState {
    toggle: boolean;
}

const Card = initializeWith({
        state: () => ({toggle: false})
    },
    (vdom: VdomFunctional<CardProps, CardState>) => {
        return v("div", [
            v("p", {style: {display: "inline"}}, `Card ${vdom.props.name}\u00a0`),
            v("button", {
                onclick: () => vdom.state.toggle = !vdom.state.toggle
            }, "Toggle"),
            vdom.state.toggle && v("p", {style: {display: "inline"}}, "\u00a0enabled\u00a0")
        ]);
    }
);


// Model
const generate_list = () => {
    const list: string[] = [];
    for (let i = 0; i < 10; ++i) {
        list.push(`${faker.name.firstName()} ${faker.name.lastName()}`);
    }
    return list;
}

let name_list = generate_list();

// Root view
export default () => v(() => v("div", [
    v("h1", "State example"),
    v("button", {onclick: () => name_list = faker.helpers.shuffle(name_list)}, "shuffle"),
    v("ul", name_list.map((name) => v(Card, {props: {name}, key: name})))
]))

