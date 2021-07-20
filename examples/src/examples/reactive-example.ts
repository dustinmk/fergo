import {v, redraw, VdomFunctional} from "fergo/index";
import flyd from "flyd";

export default () => {
    
    const input = flyd.stream<Event>();
    const clear = flyd.stream<Event>();
    const input_value = flyd.merge(flyd.map((event: Event) => (<HTMLInputElement>event.target).value, input), flyd.stream(""));
    let count = 0;
    const count_stream = flyd.stream(count);
    setInterval(() => count_stream(++count), 1000);
    const view_data = flyd.combine((string_value: flyd.Stream<string>, count_value: flyd.Stream<number>) => ({
        string_value: string_value(),
        count_value: count_value()
    }), [flyd.merge(input_value, flyd.map(() => "", clear)), count_stream]);

    const view = flyd.map(({string_value, count_value}: {string_value: string, count_value: number}) =>
        v("div", [
            v("input", {oninput: input, value: string_value}),
            v("button", {onclick: clear}, "Clear"),
            v("p", string_value),
            v("p", `${count_value}`)
        ]), view_data);

    // Duplicate redraws are suppressed by redrawAsync
    // Can abstract this to make a stream to component conversion function
    return v((_: VdomFunctional<{}, {on: flyd.Stream<void>}>) => view(), {
        oninit: (vdom) => vdom.state = {on: flyd.on(() => redraw(vdom), view)},
        onremove: (vdom) => vdom.state.on.end(true)
    });
}