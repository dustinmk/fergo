import {Vdom, mount, redraw, v} from "../index";
import faker from "faker";

const MAX_INDEX = 10000;

const list: string[] = [];
for (let i = 0; i < MAX_INDEX; ++i) {
    list.push(faker.internet.email());
}

const root = v(() => {
    return v("div", [
        v("h1", "Closure example"),
        v("ul", list.map(item => child({text: item})))
    ])
})

const child_generator = (_: Vdom, props: {text: string}) => {
    return v("li", props.text)
}

const child = (props: {text: string}) => v(child_generator, props)

setInterval(() => {
    const index = Math.floor(Math.random() * list.length);
    list[index] = faker.internet.email();
    redraw(root);
})

// const static_root = v("div", [
//     v("h1", "Static root"),
//     childComponent("text")
// ])

// function childComponent(param: string) {
    
//     let state = 0;
//     const static_child = v("div", [
//         v("p", `child ${param}`),
//         () => v("p", `State: ${state}`)
//     ])

//     setInterval(() => {
//         state += 1;
//         redraw(static_child);
//     }, 1000)

//     return () => static_child
// }

const root_elem = document.getElementById("root");
if (root_elem === null) {
    throw Error("root div not found in HTML");
}
mount(root_elem, root);

