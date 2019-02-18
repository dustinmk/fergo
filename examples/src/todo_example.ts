import {v} from "minim/index";

export default () => {
    // Todo Model
    interface Todo {
        done: boolean;
        text: string
    }

    let count = 0;
    let text = "";
    const todos: Array<Todo> = [{done: false, text: "eat pencil"}];
    for (let i = 0; i < 10; ++i) {
        todos.push({done: i % 3 === 0, text: `todo ${i}`})
    }

    // Todo List View
    const view = () => {
        return v("div", [
            v("p", "v1"),
            v("h1", "Todo Example"),
            v("input", {
                oninput: (evt: Event) => text = (<HTMLInputElement>evt.target).value
            }),
            v("button", {
                onclick: () => text.length > 0 &&
                    todos.push({done: false, text: `${text} ${++count}`})
            }, "Add todo"),
            v("ul", todos.map(todo => Todo(todo))),
        ]);
    }

    // Todo Element View
    const Todo = (todo: Todo) => {
        return v(`li.${todo.done ? "todo_done" : "todo_not-done"}`, [
            v("p", {
                style: {display: "inline"},
                onclick: () => todo.done = !todo.done
            }, todo.text),
            v("button", {
                style: {display: "inline"},
                onclick: () => todos.splice(todos.indexOf(todo), 1)
            }, "X")
        ])
    }

    return v(view);
}