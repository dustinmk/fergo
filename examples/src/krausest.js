import {v, mount, redraw} from "minim/index";
import {Store} from "./store";

const store = new Store();
let selected = null;

const Row = vdom => {
    if (vdom.state === null) {
        vdom.state = 1
        vdom.attributes.shouldUpdate = (o, n) => o.label !== n.label || o.selected !== n.selected;
    }

    return v(vdom.props.id === store.selected ? "tr.danger" : "tr", [
        v("td.col-md-1", vdom.props.id.toString()),
        v("td.col-md-4",
            v("a", {onclick: () => {
                store.select(vdom.props.id);
                if (selected !== null) redraw(selected);
                selected = vdom;
            }}, vdom.props.label)),
        v("td.col-md-1",
            v("a", {onclick: () => {store.delete(vdom.props.id); redraw(View);}},
                v("span.glyphicon.glyphicon-remove", {"aria-hidden": "true"}))),
        v("td.col-md-6")
    ]);
};

const Header = (vdom) => v("div.jumbotron", [
    v("div.row", [
        v("div.col-md-6", [
            v("h1", "Fergo - keyed")
        ]),
        v("div.col-md-6", [
            v("div.row", [
                v("div.col-sm-6.smallpad", [
                    v("button.btn.btn-primary.btn-block", {
                        type: "button",
                        id: "run",
                        onclick: {redraw: false, handler: () => {vdom.props.store.run(); redraw(View)}}
                    }, "Create 1,000 rows")
                ]),
                v("div.col-sm-6.smallpad", [
                    v("button.btn.btn-primary.btn-block", {
                        type: "button",
                        id: "runlots",
                        onclick: {redraw: false, handler: () => {vdom.props.store.runLots(); redraw(View)}}
                    }, "Create 10,000 rows")
                ]),
                v("div.col-sm-6.smallpad", [
                    v("button.btn.btn-primary.btn-block", {
                        type: "button",
                        id: "add",
                        onclick: {redraw: false, handler: () => {vdom.props.store.add(); redraw(View)}}
                    }, "Append 1,000 rows")
                ]),
                v("div.col-sm-6.smallpad", [
                    v("button.btn.btn-primary.btn-block", {
                        type: "button",
                        id: "update",
                        onclick: {redraw: false, handler: () => {vdom.props.store.update(); redraw(View)}}
                    }, "Update every 10th row")
                ]),
                v("div.col-sm-6.smallpad", [
                    v("button.btn.btn-primary.btn-block", {
                        type: "button",
                        id: "clear",
                        onclick: {redraw: false, handler: () => {vdom.props.store.clear(); redraw(View)}}
                    }, "Clear")
                ]),
                v("div.col-sm-6.smallpad", [
                    v("button.btn.btn-primary.btn-block", {
                        type: "button",
                        id: "swaprows",
                        onclick: {redraw: false, handler: () => {vdom.props.store.swapRows(); redraw(View)}}
                    }, "Swap Rows")
                ])
            ])
        ])
    ])
])

const View = v(() => v("div.container", [
    v(Header, {props: {store}}),
    v("table.table.table-hover.table-striped.test-data",
        v("tbody", store.data.map(data => v(Row, {props: {...data, selected: data.id === store.selected}, key: data.id})))),
    v("span.preloadicon.glyphicon.glyphicon-remove", {"aria-hidden": "true"})
]))

mount(document.getElementById("root"), View);

