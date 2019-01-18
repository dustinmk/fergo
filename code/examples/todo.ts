import {v, redraw, Vdom} from "../src";

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

    // Todo View
    const view = () => {
        return v("div", {oninit: setAnothaOne}, [
            v("p", "v1"),
            v("h1", "Todo Example"),
            v("input", {
                oninput: (evt: Event) => text = (<HTMLInputElement>evt.target).value
            }),
            v("ul", todos.map(todo => Todo(todo))),
            v("button", {
                onclick: () => text.length > 0 &&
                    todos.push({done: false, text: `${text} ${++count}`})
            }, "Add todo"),
            v("input", {
                type: "checkbox",
                onclick: () => anotha = !anotha,
                checked: anotha
            }),
            v("label", "Anotha one?")
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
    }, 2000);

    // Other component
    const Todo = (todo: Todo) =>
        v(`li.${todo.done ? "todo_done" : "todo_not-done"}`, {
            onclick: () => todo.done = !todo.done
        }, todo.text)


    return v(view);
}