import {DataSource} from "fergo-examples/data_source";
import {Component} from "fergo/index";

export abstract class ObservingComponent<PropType extends object = {}> extends Component<PropType> {
    protected subscribe<Payload>(subscription: DataSource<Payload>, handler: (payload: Payload) => void) {
        handler(subscription.current_payload);
        subscription.on(payload => {
            handler(payload);
            this.redraw();
        });
    }
}