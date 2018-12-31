import {v, redraw, mount, Vdom} from "..";

// Set Up
class EventSource<Payload> {
    private handlers: Array<(payload: Payload) => void> = [];

    public on(handler: (payload: Payload) => void) {
        this.handlers.push(handler);
        return () => {
            const index = this.handlers.indexOf(handler);
            if (index >= 0) {
                this.handlers.splice(index, 1);
            }
        }
    }

    public emit(payload: Payload) {
        this.handlers.forEach(handler => handler(payload));
    }
}

abstract class Component {
    private component: Vdom;

    constructor() {
        this.component = v(() => this.view());
    }

    protected redraw() {
        redraw(this.component);
    }

    protected subscribe<Payload>(subscription: EventSource<Payload>, handler: (payload: Payload) => void) {
        subscription.on(payload => {
            handler(payload);
            this.redraw();
        });
    }

    protected abstract createView(): Vdom;

    public view() {
        return this.component;
    }
}


// Component
class cDoc extends Component {
    private text: string = "default text";

    constructor(text_source: EventSource<string>) {
        super();
        this.subscribe(text_source, text => this.text = text);
    }

    public createView() {
        return v("p", this.text);
    }
}

const Doc = (text_source: EventSource<string>) => new cDoc(text_source);

// Model
const text_event = new EventSource<string>();
let count = 0;
setInterval(() => text_event.emit(`Count is: ${++count}`), 1000);

// Mount
const root_component = Doc(text_event);
const root_elem = document.getElementById("root");
if (root_elem === null) {
    throw Error("root div not found in HTML");
}
mount(root_elem, root_component.view());