import {v, mount, router, VdomFunctional, Path, go, link} from "minim/index";

const subrouter = router({
    "/a": () => v("p", "a"),
    "/b": () => v("p", "b"),
    "/c": () => v("div", [
        link(subrouter, "/a", "a"),
        link(subrouter, "/b", "b")
    ])
}, v("p", "goose 404"));

const r = router({
    "/": () => v("div", [
        v("p", "home"),
        v("button", {onclick: () => go(r, ["g", "5", "w", "7", "l"])}, "go")
    ]),
    "/name": () => v("p", "name"),
    "/g/:param/w/:goose/l": (vdom: VdomFunctional<Path>) =>
        v("p", `Params: ${vdom.props["param"]} ${vdom.props["goose"]}`),
    "/p/*": (vdom: VdomFunctional<Path>) => v("p", `Path: ${vdom.props.path}`),
    "/r": subrouter
}, v("p", "404"));

const root = document.getElementById("root");
if (root === null) {
    throw new Error("Could not find root element")
}

mount(root, () => v("div", [
    link(r, "/name", "Name"),
    link(r, "/g/19/w/67/l", "Params"),
    link(r, "/p/sub/path", "Path"),
    link(r, "/r/a", "Sub A"),
    link(r, "/r/b", "Sub B"),
    link(r, "/r/c", "Sub c"),
    r.view
]));