import {v, Vdom} from "minim/index";

const svg = (selector: string, attr: {[index: string]: any}, children?: Vdom[]) => {
    return children === undefined
        ? v(selector, {...attr, namespace: "http://www.w3.org/2000/svg"})
        : v(selector, {...attr, namespace: "http://www.w3.org/2000/svg"}, children)
}

export default () => {
    let x = 0;
    const view = () => v("div", [
        v("button", {onclick: () => x += 10}, "move"),
        svg("svg", {viewBox: "0 0 300 100"}, [
            svg("filter#blurMe", {namespace: svg}, [
                svg("feGaussianBlur", {in: "SourceGraphic", stdDeviation: 5})
            ]),
            svg("circle", {cx: 50 + x, cy: 50, r: 40, stroke: "red", fill: "grey", filter: "url(#blurMe)"})
        ])
    ]);

    return v(view);
}