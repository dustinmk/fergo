import {Vdom, v, VdomFunctionalNotInit, VdomFunctional} from "./vdom";
import {redraw} from "./redraw";

export abstract class Component<PropType extends object = {}> {
    protected abstract render(props: PropType): Vdom;
    protected shouldUpdate?(old_props: PropType, new_props: PropType): boolean;
    protected onMount?(): void;
    protected onUnmount?(): void;

    private component: Vdom = v(() => {
        throw new Error("Must initiate component with view()");
    });

    constructor(protected props: PropType | null) {}

    protected redraw() {
        redraw(this.component);
    }

    // Return component-style vdom: v((vdom, props) => vdom, props)
    public view() {
        if (this.props === null) throw new Error("Props must be an obejct");
        return this.render(this.props);
    }

    static Make<PropType extends object, ComponentType extends Component<PropType>>(component: new (props: PropType) => ComponentType) {
        // Create the generator once so that it compares with itself equally when checking
        // if the instance should get new props or be replaced
        const generator = (vdom: VdomFunctionalNotInit<PropType, {instance: ComponentType}>) => {
            if (vdom.state === null) throw new Error("State must be initialized");
            vdom.state.instance.props = vdom.props;
            vdom.state.instance.component = vdom as Vdom;
            return vdom.state.instance.view()
        };

        return (props: PropType) => {
            const instance = new component(props);

            const attributes = {
                props,
                state: {instance},

                shouldUpdate: instance.shouldUpdate === undefined
                    ? undefined
                    : (o: PropType, n: PropType, s: {instance: ComponentType}) => {
                        if (s.instance.shouldUpdate === undefined) {
                            throw new Error("shouldUpdate is not defined");
                        }
                        return s.instance.shouldUpdate(o, n);
                    },

                onMount: (vdom: VdomFunctional<PropType, {instance: ComponentType}>) => {
                    if (vdom.state !== null && vdom.state.instance.onMount !== undefined) {
                        vdom.state.instance.onMount();
                    }
                },

                onUnmount: (vdom: VdomFunctional<PropType, {instance: ComponentType}>) => {
                    if (vdom.state !== null && vdom.state.instance.onUnmount !== undefined) {
                        vdom.state.instance.onUnmount();
                    }
                },
            };

            instance.component = v(generator, attributes);
            return instance.component;
        }
    }
}
