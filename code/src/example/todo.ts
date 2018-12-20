import {v, redraw, mount} from "../framework";

// Todo Model
interface Todo {
    done: boolean;
    text: string
}

let count = 0;
let text = "";
let anotha = false;
const todos: Array<Todo> = [{done: false, text: "eat pencil"}];

// Todo View
const root = v(() =>
    v("div", [
        v("h1", "Todo Example"),
        v("input", {
            oninput: (evt: Event) => text = (<HTMLInputElement>evt.target).value
        }),
        v("ul", todos.map(todo => Todo(todo))),
        v("button", {
            onclick: () => {
                if (text.length > 0) {
                    todos.push({done: false, text: `${text} ${++count}`})
                }
            }
        }, "Add todo"),
        v("input", {
            type: "checkbox",
            onclick: () => anotha = !anotha,
            checked: anotha
        }),
        v("label", "Anotha one?")
    ]))

// Other component
const Todo = (todo: Todo) => 
    v(`li.${todo.done ? "todo_done" : "todo_not-done"}`, {
        onclick: () => todo.done = !todo.done
    }, todo.text)

// External changes example
setInterval(() => {
    if(anotha) {
        todos.push({
            done: false,
            text: `Anotha one ${++count}`
        });
        redraw(root);
    }
}, 2000);

// DOM Mounting
const root_elem = document.getElementById("root");
if (root_elem === null) {
    throw Error("root div not found in HTML");
}

mount(root_elem, root);