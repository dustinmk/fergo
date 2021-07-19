import {v, VdomFunctional} from "minim/index";

// XKCD api
class Api {
    fact = async (num: number) => fetch(`http://numbersapi.com/${num}`)
        .then(res => res.text())
}

const viewer_factory = (api: Api) => (vdom: VdomFunctional<null, {
    num: number,
    fact: string
}>) => {
    if (vdom.state === null) {
        vdom.state = {
            num: 0,
            fact: ""
        }
    }

    const getfact = async () => {
        if (!isNaN(vdom.state.num)) {
            vdom.state.fact = await api.fact(vdom.state.num)
        }
    }

    return v("div", [
        v("h3", "Number facts"),
        v("input", {
            oninput: (e: Event) => vdom.state.num = parseInt((e.target as HTMLInputElement).value),
            onkeydown: async (e: KeyboardEvent) => e.key === "Enter" && await getfact()
        }),
        v("button", {onclick: getfact}, "Get Fact"),
        v("p", vdom.state.fact)
    ])
}

export default () => {
    const api = new Api();
    const viewer = viewer_factory(api);

    return v(() => v("div", [
        v(viewer, {})
    ]))
}