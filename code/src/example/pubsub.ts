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
    private component: Vdom = v(() => {
        if(this.current_view === null) {
            this.current_view = this.render();
        }
        return this.current_view;
    });

    private current_view: Vdom | null = null;

    constructor() {}

    protected redraw() {
        this.current_view = this.render();
        redraw(this.component);
    }

    protected subscribe<Payload>(subscription: EventSource<Payload>, handler: (payload: Payload) => void) {
        subscription.on(payload => {
            handler(payload);
            this.redraw();
        });
    }

    protected abstract render(): Vdom;

    public view() {
        return this.component;
    }
}

// Component
const Doc = (text_source: EventSource<string>) => new (class extends Component {
    private text: string = "default text";

    constructor(text_source: EventSource<string>) {
        super();
        this.subscribe(text_source, text => this.text = text);
    }

    public render() {
        return v("p", this.text);
    }
})(text_source);

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