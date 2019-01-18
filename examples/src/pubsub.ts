import {v, redraw, mount, Vdom, ComponentAttributes} from "src";

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

    constructor(protected props: PropType) {}

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
    public view() {
        return this.render(this.props);
    }

    static MakeComponent<PropType, ComponentType extends Component>(component: new (props: PropType) => ComponentType) {
        // Create the generator once so that it compares with itself equally when checking
        // if the instance should get new props or be replaced
        const generator = (vdom: ComponentAttributes<PropType, ComponentType | null>) => {
            if (vdom.state === null) {
                vdom.state = new component(vdom.props);
            }
            vdom.state.props = vdom.props;
            vdom.state.component = vdom as Vdom;
            return vdom.state.view()
        };

        return (props: PropType) => {
            return v(generator, {props, state: null, shouldUpdate: (o: PropType, n: PropType, s: ComponentType | null) => {
                if (s !== null) {
                    return s.shouldUpdate(o, n);
                }
                return true;
            }});
        }
    }
}


// Component
interface MyProps {
    prop: string;
    text_source: DataSource<string>;
}

class _Doc extends Component<MyProps> {
    private text: string = "default text";

    constructor(props: MyProps) {
        super(props);
        this.subscribe(props.text_source, text => this.text = text);
    }

    // defer() pattern. Dynamic elements must be functional since the
    // root element is static. This helps when putting components inline
    // when they must not be created more than once, or when there are 
    // large static DOM trees that change in very minor ways
    render = () => v("div", [
        v("p", this.text),
        v("p", this.props && this.props.prop),
    ]);
}

const Doc = Component.MakeComponent(_Doc);

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
// TODO: Closure pattern example - store instances as high as possible in closure,
//      then just include them in the returned closure

class Root extends Component<{}> {
    private prop_value = 0;

    constructor() {
        super({});
    }

    render = () => v("div", [
        v("h1", "PubSub Example"),
        v("button", {onclick: () => this.prop_value += 1}, "inc"),
        Doc({text_source: text_event, prop: `${this.prop_value}`})
    ]);
};

const root = new Root();

// Mount
const root_elem = document.getElementById("root");
if (root_elem === null) {
    throw Error("root div not found in HTML");
}
mount(root_elem, () => root.view());

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