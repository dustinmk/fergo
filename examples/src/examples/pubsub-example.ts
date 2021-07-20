import {v, Component} from "fergo/index";
import {DataSource} from "fergo-examples/data_source";
import {ObservingComponent} from "fergo-examples/observing_component";

// Model
const text_event = new DataSource<string>("init text");
let count = 0;
setInterval(() => {
    count += 1;
    text_event.emit(`Count is: ${count}`);
}, 1000);

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

interface DocProps {
    prop: string;
    text_source: DataSource<string>;
}

const Doc = Component.Make(class extends ObservingComponent<DocProps> {
    private text: string = "default text";

    constructor(props: DocProps) {
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
