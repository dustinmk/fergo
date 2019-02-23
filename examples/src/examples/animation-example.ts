import {v, redraw} from "minim/index";

const range = (start: number, end: number, step: number = 1) => {
    const result = [];
    for (let i = start; i < end; i += step) {
        result.push(i);
    }
    return result;
}

export default () => {

    const style_elem = document.createElement("style");
    style_elem.textContent = `
        body {
            margin: 0;
            padding: 0;
        }
        
        .background {
            position: fixed;
            width: 100%;
            height: 100%;
            background-color: red;
            margin: 0;
            padding: 0;
        }
        
        table {
            position: fixed;
            border-spacing: 0;
        }

        td {
            width: 5em;
            height: 5em;
            background-color: #333333;
            margin: 0;
            padding: 0;
        }
    `
    document.head.appendChild(style_elem);

    const start_time = Date.now();
    let delta_time = Date.now() - start_time;
    const vdom = v(() => v("div", [
        v("div.background"),
        v("table", range(0, 10).map(row =>
            v("tr", range(0, 10).map(col => {
                const x = 20 * Math.sin((delta_time / 300) + row);
                const y = 20 * Math.sin((delta_time / 173) + col);
                return v("td", {style: {transform: `translate(${x}px, ${y}px)`}})
            }))
        ))
    ]));

    const frame = () => {
        delta_time = Date.now() - start_time;
        redraw(vdom);
        requestAnimationFrame(frame);
    }

    frame();

    return vdom;
}