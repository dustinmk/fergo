import {Vdom} from "./vdom";

export interface RouteMap {
    parent: RouteMap | null;
    routes: {[index: string]: Route}
}

interface Params {
    [index: string]: string;
}

type Route = RouteMap | ((params: Params) => Vdom)

// // Build a route map with respect to the parent route map
// export const route = () => {

// }

// // Create a link vdom
// export const link = (routes: RouteMap) => {

// }

// export const go = (routes: RouteMap) => {

// }

// export const fromURL = (routes: RouteMap) => {
    
// }