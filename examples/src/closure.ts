import {redraw, v, UserVdom} from "../../src";
import faker from "faker";

export default () => {
    const MAX_INDEX = 10;

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

    const child_generator = (vdom: UserVdom<{text: string}>) => {
        return v("li", vdom.props.text)
    }

    const child = (props: {text: string}) => v(child_generator, {props, state: {}})

    setInterval(() => {
        const index = Math.floor(Math.random() * list.length);
        list[index] = faker.internet.email();
        redraw(root);
    });

    return root;
}


