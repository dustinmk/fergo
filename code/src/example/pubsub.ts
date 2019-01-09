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

abstract class Component<PropType extends object = {}> {
    private component: Vdom = v(() => {
        throw new Error("Must initiate component with view()");
    });

    private current_view: Vdom | null = null;

    private current_props: PropType | null = null;

    constructor() {}

    protected redraw() {
        redraw(this.component);
    }

    protected subscribe<Payload>(subscription: EventSource<Payload>, handler: (payload: Payload) => void) {
        subscription.on(payload => {
            handler(payload);
            this.redraw();
        });
    }

    protected abstract render(props: PropType): Vdom;
    protected shouldUpdate(old_props: PropType, new_props: PropType) {
        return old_props !== new_props;
    }

    public view(props: PropType | (() => PropType)) {
        this.component = v(() => {
            const new_props = typeof props !== "object"
                ? props()
                : props;
            
            if (this.current_view === null
                || this.current_props === null
                || this.shouldUpdate(this.current_props, new_props)
            ) {
                this.current_props = new_props;
                this.current_view = this.render(new_props);
            }
            return this.current_view;
        });
        return this.component;
    }
}

function defer(vdom: Vdom) {
    return () => vdom;
}

// Component
interface Props {
    prop: string;
}

const Doc = (text_source: EventSource<string>) => new (class extends Component<Props> {
    private text: string = "default text";

    constructor(text_source: EventSource<string>) {
        super();
        this.subscribe(text_source, text => this.text = text);
    }

    public render(props: Props) {
        return v("div", [
            v("p", this.text),
            v("p", props.prop),
        ]);
    }
})(text_source);

// Model
const text_event = new EventSource<string>();
let prop_value = 0;
let count = 0;
setInterval(() => {
    count += 1;
    text_event.emit(`Count is: ${count}`);
}, 1000);

const root = new (class extends Component {
    constructor() {
        super();
        // setInterval(() => {
        //     prop_value += 1;
        //     this.redraw();
        // }, 1000);
    }

    render = defer(v("div", [
        v("h1", "PubSub Example"),
        v("button", {onclick: () => prop_value += 1}, "inc"),
        Doc(text_event).view(() => ({prop: `${prop_value}`}))
    ]));
})();

// Mount
const root_elem = document.getElementById("root");
if (root_elem === null) {
    throw Error("root div not found in HTML");
}
mount(root_elem, root.view({}));