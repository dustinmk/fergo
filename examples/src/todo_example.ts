import {v, redraw, Vdom, ComponentAttributes} from "src";

// Todo Model
interface Todo {
    done: boolean;
    text: string
}

export default () => {
    let count = 0;
    let text = "";
    let anotha = false;
    const todos: Array<Todo> = [{done: false, text: "eat pencil"}];
    for (let i = 0; i < 3000; ++i) {
        todos.push({done: i % 3 === 0, text: `todo ${i}`})
    }

    // Todo View
    const onadd = () => text.length > 0 &&
        todos.push({done: false, text: `${text} ${++count}`});
    const oninput = (evt: Event) => text = (<HTMLInputElement>evt.target).value;
    const ontoggle_anotha = () => anotha = !anotha;

    const view = () => {
        return v("div", {oninit: setAnothaOne}, [
            v("p", "v1"),
            v("h1", "Todo Example"),
            v("input", {
                oninput: oninput
            }),
            v("button", {
                onclick: onadd
            }, "Add todo"),
            v("input", {
                type: "checkbox",
                onclick: ontoggle_anotha,
                checked: anotha
            }),
            v("label", "Anotha one?"),
            v("button", {
                onclick: () => todos.push({
                    done: false,
                    text: `Anotha one ${++count}`
                })
            }, "Add anotha"),
            v("ul", todos.map(todo => v(Todo, {props: {todo}}))),
        ]);
    }

    // External changes example
    const setAnothaOne = (vdom: Vdom) => setInterval(() => {
        if(anotha) {
            todos.push({
                done: false,
                text: `Anotha one ${++count}`
            });
            redraw(vdom);
        }
    }, 100);

    // Wrap in a component for performance - will only redraw if the
    // instance of `todo` is replaced
    const Todo = (vdom: ComponentAttributes<{todo: Todo}>) => {
        const {todo} = vdom.props;

        return v(`li.${todo.done ? "todo_done" : "todo_not-done"}`, {
            onclick: () => todo.done = !todo.done
        }, todo.text);
    }

    return v(view);
}