import {v, mount, router, VdomFunctional, Path, go, link, redraw} from "minim/index";

const subrouter = router({
    "/a": () => v("p", "a"),
    "/b": () => v("p", "b"),
    "/c": () => v("div", [
        link(subrouter, "/a", "a"),
        link(subrouter, "/b", "b")
    ])
}, v("p", "goose 404"));

const numrouter = router({
    "/1": () => v("p", "1"),
    "/2": () => v("p", "2"),
    "/3": () => v("div", [
        link(numrouter, "/1", "1"),
        link(numrouter, "/2", "2")
    ])
}, v("p", "boose 404"));

const r = router({
    "/": () => v("div", [
        v("p", "home"),
        v("button", {onclick: () => go(r, ["g", "5", "w", "7", "l"])}, "go")
    ]),
    "/name": () => v("p", "name"),
    "/g/:param/w/:goose/l": (vdom: VdomFunctional<Path>) =>
        v("p", `Params: ${vdom.props["param"]} ${vdom.props["goose"]}`),
    "/p/*": (vdom: VdomFunctional<Path>) => v("p", `Path: ${vdom.props.path}`),
    "/r": subrouter,
    "/t/*": (vdom: VdomFunctional<Path>) => {
        // TODO: have an subroute(router, view => Vdom) => (VdomFunctional => Vdom) function
        // Then you can ` "/t/*": subroute(numrouter, view => v("div", view)) `
        numrouter.parent = r;
        numrouter.path = vdom.props.path;
        numrouter.parent_path = ["t"];
        redraw(numrouter.view);
        return v("div", [
            v("p", "numrouter"),
            numrouter.view
        ])
    }
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
    link(r, "/t/3", "Nested"),
    r.view
]));