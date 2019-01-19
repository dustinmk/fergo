import {DataSource} from "examples/data_source";
import {Component} from "src/component";

export abstract class ObservingComponent<PropType extends object = {}> extends Component<PropType> {
    protected subscribe<Payload>(subscription: DataSource<Payload>, handler: (payload: Payload) => void) {
        handler(subscription.current_payload);
        subscription.on(payload => {
            handler(payload);
            this.redraw();
        });
    }
}