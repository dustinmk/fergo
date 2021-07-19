import {v, Vdom, redraw} from "minim/index";

export default () => {
    
    let modal_content: Vdom | null = null;
    const modal = (content: (dismiss: () => void) => Vdom) => {
        modal_content = content(() => {
            modal_content = null;
            redraw(modal_view);
        });
        redraw(modal_view);
    };

    const modal_view = v(() => v("div", {style: {
        "z-index": "1000",
        display: modal_content === null ? "none" : "block",
        position: "fixed", width: "100%", height: "100%", top: "0px", left: "0px"
    }}, [
        v("div", {style: {position: "absolute", width: "100%", height: "100%", "background-color": "red", "opacity": "0.6"}}),
        v("div", {style: {position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)"}}, [
            modal_content
        ])
    ]));

    const text = () => v("div", [
        v("p", "Text section"),
        v("button", {
            onclick: () => modal((dismiss) => v(() => v("div", [
                v("p", "press okay"),
                v("button", {onclick: dismiss}, "Close")
            ])))
        }, "Open modal")
    ]);

    const view = () => v("div", [
        text,
        modal_view 
    ]);

    return v(view);
}