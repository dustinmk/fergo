import { Vdom } from "src/index";
import { ComponentAttributes } from "src/vdom";
export declare function testMountCallbacks(when_mounted: string, root_generator: (toggle: boolean, component: Vdom) => Vdom): void;
export declare function testElementCallbacks(when_mounted: string, root_generator: (toggle: boolean, component: Vdom) => Vdom): void;
export declare function mountAndMatch(vdom: Vdom | ((vdom: ComponentAttributes<any, any>) => Vdom), tag: string, result: string[]): void;
export declare function redrawAndMatch(vdom: Vdom, tag: string, result: string[]): void;
export declare function getRootElement(): HTMLElement;
export declare function printDocument(): void;
