import {v, Vdom, VdomFunctional, VDOM_NODE, redraw} from "minim/index";

export default () => {

    interface DraggableState {
        x: number;
        y: number;
        offset_x: number;
        offset_y: number;
        dragging: boolean;
    }

    const Draggable = <PropType, StateType extends {}>(component: (vdom: VdomFunctional<PropType, StateType & DraggableState>) => Vdom) => {

        return (vdom: VdomFunctional<PropType, StateType & DraggableState>) => {
            let instance: Vdom;
            
            if (vdom.state === null) {
                instance = component(vdom);
                if (vdom.state === null) {
                    (vdom.state as unknown) = {x: 0, y: 0, dragging: false};
                } else {
                    ((vdom.state as unknown) as DraggableState).x = 0;
                    ((vdom.state as unknown) as DraggableState).y = 0;
                    ((vdom.state as unknown) as DraggableState).dragging = false;
                }
            } else {
                instance = component(vdom);
            }

            if (vdom.state === undefined) throw new Error("state is undefined");
            
            if (instance._type === VDOM_NODE) {
                const style = {
                    left: `${vdom.state.x}px`,
                    top: `${vdom.state.y}px`,
                    position: "absolute",
                    cursor: "arrow",
                    "user-drag": "none"
                };
                const attr = instance.attributes;
                attr.draggable = "true"

                attr.onmousedown = (event: MouseEvent) => {
                    const parent = (<HTMLElement>event.currentTarget).parentElement;
                    if (parent !== null) {
                        const rect = (<HTMLElement>event.currentTarget).getBoundingClientRect();
                        vdom.state.offset_x = event.clientX - rect.left;
                        vdom.state.offset_y = event.clientY - rect.top;
                    }

                    const ondrag = (event: MouseEvent) => {
                        if (vdom.state === undefined) throw new Error("state is undefined");
                        if (parent !== null) {
                            const rect = parent.getBoundingClientRect();
                            vdom.state.x = event.clientX - rect.left - vdom.state.offset_x;
                            vdom.state.y = event.clientY - rect.top - vdom.state.offset_y;
                            redraw(vdom);
                        }
                    }

                    const ondragstop = () => {
                        document.removeEventListener("mousemove", ondrag);
                        document.removeEventListener("mouseup", ondragstop);
                        document.removeEventListener("mouseleave", ondragstop);
                        document.removeEventListener("dragstart", stop);
                    }

                    const stop = (event: Event) => {
                        event.preventDefault();
                        return false;
                    }

                    document.addEventListener("mousemove", ondrag);
                    document.addEventListener("mouseup", ondragstop);
                    document.addEventListener("mouseleave", ondragstop);
                    document.addEventListener("dragstart", stop);
                }

                attr.ondragenter = (event: DragEvent) => {
                    event.preventDefault();
                    return false;
                }
                attr.ondragover = (event: DragEvent) => {
                    event.preventDefault();
                    return false
                }
                attr.ondragstart = () => {
                    return false;
                }
                if (attr.style === undefined) attr.style = style;
                else attr.style = {...attr.style, ...style}
            }
            return instance;
        }
    }

    const TextBox = (vdom: VdomFunctional<{name: string}, any>) => v("div", {
        style: {border: "solid", width: "100px", height: "100px"}
    }, [
        v("p", {style: {"user-select": "none"}}, `Drag me: ${vdom.props.name}`)
    ]);

    return v("div", {style: {position: "relative"}}, [
        v(Draggable(TextBox), {props: {name: "steve"}})
    ]);
}