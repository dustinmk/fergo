import {v} from "minim/index";

export default () => {
    let x = 0;
    const svg = "http://www.w3.org/2000/svg";
    const view = () => v("div", [
        v("button", {onclick: () => x += 10}, "move"),
        v("svg", {namespace: svg, viewBox: "0 0 300 100"}, [
            v("filter#blurMe", {namespace: svg}, [
                v("feGaussianBlur", {namespace: svg, in: "SourceGraphic", stdDeviation: 5})
            ]),
            v("circle", {namespace: svg, cx: 50 + x, cy: 50, r: 40, stroke: "red", fill: "grey", filter: "url(#blurMe)"})
        ])
    ]);

    return v(view);
}