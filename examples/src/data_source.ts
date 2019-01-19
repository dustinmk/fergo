

export class DataSource<Payload> {
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