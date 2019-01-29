import {ComponentAttributes, v, mount, Vdom } from "minim/index";
import faker from "faker";

interface CardProps {
    name: string;
}

interface CardState {
    toggle: boolean;
}

// export const component = <PropType, StateType>(
//     generator: (vdom: ComponentAttributes<PropType, StateType>) => Vdom,
//     attributes: Partial<ComponentAttributes<PropType, StateType>>
// ) => {
//     return (props: PropType) => v(generator, {...attributes, props});
// } 

// export const component = <PropType, StateType>(
//     generator: (vdom: ComponentAttributes<PropType, StateType>) => Vdom,
//     attributes: Partial<ComponentAttributes<PropType, StateType>>
// ) => {
//     return (vdom: ComponentAttributes<PropType, StateType>) => v(generator, {...attributes, props: vdom.props});
// }

// const jsx_test = jsxComponent((vdom: ComponentAttributes<{name: string}, {count: 0}>) => {
//     return v("div", [
//         v("p", vdom.props.name),
//         v("p", "" + vdom.state.count++)
//     ])
// }, {state: {count: 0}});

// v("div", [
//     v(jsx_test, {props: {name: "steve"}})
// ])

// const Card = component((vdom: ComponentAttributes<CardProps, CardState>) => 
//     v("div", [
//         v("p", `Card ${vdom.props.name}`),
//         v("button", {
//             onclick: () => vdom.state.toggle = !vdom.state.toggle
//         }, "Toggle"),
//         vdom.state.toggle && v("p", "enabled")
//     ]
// ), {state: {toggle: true}, key: name});

const Card = (vdom: ComponentAttributes<CardProps, CardState>) => {

    // Initialize component
    if (vdom.state === undefined) {
        vdom.shouldUpdate = (o, n) => o !== n;  // When first rendered, shouldUpdate not required
        vdom.oninit = () => {};    // oninit called after generation
        vdom.onremove = () => {};
        vdom.state = {toggle: false};
    }

    return v("div", [
        v("p", `Card ${vdom.props.name}`),
        v("button", {
            onclick: () => vdom.state.toggle = !vdom.state.toggle
        }, "Toggle"),
        vdom.state.toggle && v("p", "enabled")
    ]);
}

v(Card, {props: {name: "steve"}, key: "1"});

const initializeWith = <PropType, StateType>(
    generator: (vdom: ComponentAttributes<PropType, StateType>) => Vdom,
    attributes: Partial<ComponentAttributes<PropType, StateType>>
) => {
    return (vdom: ComponentAttributes<PropType, StateType>) => {
        if (vdom.state === undefined) {
            vdom.shouldUpdate = attributes.shouldUpdate;
            vdom.oninit = attributes.oninit;
            vdom.onremove = attributes.onremove;
            if(attributes.state !== undefined) vdom.state = attributes.state;
        }

        return generator(vdom);
    }
}

export const Card2 = initializeWith((vdom: ComponentAttributes<CardProps, CardState>) => {
    return v("p", `${vdom.props.name}: ${vdom.state.toggle}`);
}, {state: {toggle: true}})

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
    v("ul", name_list.map((name) => v(Card, {props: {name}})))
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
// const di_example = (api_service: {load: () => string[]}) => {
//     const generator = (vdom: UserVdom<{}, {values: string[]}>) => {
//         if (vdom.state === undefined) {
//             vdom.state = {values: []};
//         }

//         return v("button", {onclick: () => vdom.state.values = api_service.load()}, "Load");
//     }

//     return () => v(generator, {})
// }

// Create factory with `const example_factory = di_example()`
// Components can create instances with `v("div", [example_factory()])`
// Can also just pass data as props