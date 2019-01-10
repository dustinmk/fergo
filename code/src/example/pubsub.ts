import {v, redraw, mount, Vdom} from "..";

// Set Up
class DataSource<Payload> {
    private handlers: Array<(payload: Payload) => void> = [];
    public current_payload: Payload;

    constructor(init: Payload) {
        this.current_payload = init;
    }

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
        this.current_payload = payload;
        this.handlers.forEach(handler => handler(payload));
    }
}

abstract class Component<PropType extends object = {}> {
    private component: Vdom = v(() => {
        throw new Error("Must initiate component with view()");
    });

    // private current_view: Vdom | null = null;
    protected props: PropType | null = null;

    constructor() {}

    protected redraw() {
        redraw(this.component);
    }

    protected subscribe<Payload>(subscription: DataSource<Payload>, handler: (payload: Payload) => void) {
        handler(subscription.current_payload);
        subscription.on(payload => {
            handler(payload);
            this.redraw();
        });
    }

    protected abstract render(props: PropType): Vdom;
    protected shouldUpdate(old_props: PropType, new_props: PropType) {
        return old_props !== new_props;
    }

    // Return component-style vdom: v((vdom, props) => vdom, props)
    public view(provided_props: PropType | (() => PropType)) {
        const new_props = typeof provided_props !== "object"
            ? provided_props()
            : provided_props;

        this.component = v((_: Vdom, props: PropType) => {
            return this.render(props)
        }, Object.assign(new_props, {shouldUpdate: this.shouldUpdate}));
        return this.component;
    }

    // Create a static vdom rather than redrawing when props are received.
    // Child components may still redraw with updated props if using the
    // prop accessor pattern: Component().view(() => ({...this.props}))
    protected defer(vdom: Vdom) {
        return (props: PropType) => {
            this.props = props;

            // Copy the root vdom so it passes through the diff algorithm
            // If it was the same instance, it would be ignored
            return {...vdom};
        }
    }

    // Conditionally select a result lazily using the defer() pattern.
    // Results are only evaulated as needed.
    protected cond(c: () => boolean, iftrue: () => Vdom, iffalse?: () => Vdom) {
        let iftrue_inst: Vdom | null = null;
        let iffalse_inst: Vdom | null = null;

        return () => {
            if (c()) {
                if (iftrue_inst === null) {
                    iftrue_inst = iftrue();
                }
                return iftrue_inst;
            } else {
                if (iffalse_inst === null && iffalse !== undefined) {
                    iffalse_inst = iffalse();
                }
                return iffalse;
            }
        }
    }

    // Store a map 
    // protected list<ItemType>(items: () => ItemType[], key: (item: ItemType) => string, map: (item: ItemType) => Vdom) {

    // }
}

// Component
interface Props {
    prop: string;
}

// TODO: State should be set as 'this' on generator so d = new Doc(); v(d.view, {state: this}); will work

const Doc = (text_source: DataSource<string>) => new (class extends Component<Props> {
    private text: string = "default text";

    constructor(text_source: DataSource<string>) {
        super();
        this.subscribe(text_source, text => this.text = text);
    }

    // defer() pattern. Dynamic elements must be functional since the
    // root element is static. This helps when putting components inline
    // when they must not be created more than once, or when there are 
    // large static DOM trees that change in very minor ways
    render = this.defer(v("div", [
        () => v("p", this.text),
        () => v("p", this.props && this.props.prop),

        // cond(() => show, () => Component().view(() => props)    // Component() will only be called once
    ]))
})(text_source);

// Model
const text_event = new DataSource<string>("init text");
let count = 0;
setInterval(() => {
    count += 1;
    text_event.emit(`Count is: ${count}`);
}, 1000);

// TODO: Sample where parent tells child to update explicity through messages,
// not relying on props
// TODO: Sample with reactive pattern
// TODO: React-like components in Vdom (that can receive new props without rebuilding)
// TODO: Closure pattern example - store instances as high as possible in closure,
//      then just include them in the returned closure
// TODO: Example with memoized components - store memoized at top, then call it with
//      props inside

const root = new (class extends Component {
    private prop_value = 0;

    constructor() {
        super();
    }

    render = () => v("div", [
        v("h1", "PubSub Example"),
        v("button", {onclick: () => this.prop_value += 1}, "inc"),

        // A new Doc() will be created every time new props are available for
        // this component. This is fine since the component's state is from
        // the constructor and subscriptions. The subscriptions provide the
        // current value when first registering. If the component must not
        // be recreated on a render, it can be created in the constructor, then
        // used here, still passing props. ALternatively, the defer() pattern 
        // can be used.
        Doc(text_event).view(() => ({prop: `${this.prop_value}`}))
    ]);
})();

// Mount
const root_elem = document.getElementById("root");
if (root_elem === null) {
    throw Error("root div not found in HTML");
}
mount(root_elem, root.view({}));

/*
If a component receives new props, it will have to rerender the vdom regardless
If the component receive the same props, it should not redraw
Consider arrays of components: should all of their vdoms be recreated if only
one element changes? Vdom recreation can be avoided if all components return the
same vdom instance as the last time. A map of key => vdom would have to be made
to keep this stored. Using keys.map(k => v()) or keys.map(k => () => v()) will just
rebuild the entire child vdom, and all of their children. The actual DOM will not be
touched, but the components will be rebuilt.
*/