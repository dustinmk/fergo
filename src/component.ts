import {Vdom, v, redraw, ComponentAttributes} from "src";

export abstract class Component<PropType extends object = {}> {
    protected abstract render(props: PropType): Vdom;
    protected shouldUpdate?(old_props: PropType, new_props: PropType): boolean;
    protected onMount?(): void;
    protected onUnmount?(): void;

    private component: Vdom = v(() => {
        throw new Error("Must initiate component with view()");
    });

    constructor(protected props: PropType) {}

    protected redraw() {
        redraw(this.component);
    }

    // Return component-style vdom: v((vdom, props) => vdom, props)
    public view() {
        return this.render(this.props);
    }

    static MakeComponent<PropType, ComponentType extends Component>(component: new (props: PropType) => ComponentType) {
        // Create the generator once so that it compares with itself equally when checking
        // if the instance should get new props or be replaced
        const generator = (vdom: ComponentAttributes<PropType, ComponentType>) => {
            vdom.state.props = vdom.props;
            vdom.state.component = vdom as Vdom;
            return vdom.state.view()
        };

        return (props: PropType) => {
            const instance = new component(props);

            const attributes = {
                props,
                state: instance,

                shouldUpdate: instance.shouldUpdate === undefined
                    ? undefined
                    : (o: PropType, n: PropType, s: ComponentType) => {
                        if (s.shouldUpdate === undefined) {
                            throw new Error("shouldUpdate is not defined");
                        }
                        return s.shouldUpdate(o, n);
                    },

                onMount: (vdom: ComponentAttributes<PropType, ComponentType>) => {
                    if (vdom.state.onMount !== undefined) {
                        vdom.state.onMount();
                    }
                },

                onUnmount: (vdom: ComponentAttributes<PropType, ComponentType>) => {
                    if (vdom.state.onUnmount !== undefined) {
                        vdom.state.onUnmount();
                    }
                },
            };

            instance.component = v(generator, attributes);
            return instance.component;
        }
    }
}
