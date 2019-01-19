import {v} from "src";
import {DataSource} from "examples/data_source";
import {ObservingComponent} from "examples/observing_component";

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

class Root extends ObservingComponent<{}> {
    private prop_value = 0;

    constructor() {
        super({});
    }

    render = () => v("div", [
        v("h1", "PubSub Example"),
        v("button", {onclick: () => this.prop_value += 1}, "inc"),
        v("button", {onclick: () => text_event.emit(`Count is: ${++count}`)}, "count"),
        Doc({text_source: text_event, prop: `${this.prop_value}`})
    ]);
};

interface MyProps {
    prop: string;
    text_source: DataSource<string>;
}

const Doc = ObservingComponent.MakeComponent(class extends ObservingComponent<MyProps> {
    private text: string = "default text";

    constructor(props: MyProps) {
        super(props);
        this.subscribe(props.text_source, text => this.text = text);
    }

    render = () => v("div", [
        v("p", this.text),
        v("p", this.props && this.props.prop),
    ]);
});

const root = new Root();

export default () => root.view();
