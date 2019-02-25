import {Vdom, VdomFunctional, v} from "./vdom";
import { redraw } from "./redraw";

export type Path = {[index: string]: string | string[]} & {path: string[]};

export interface Router {
    parent: Router | null;
    parent_path: string[];
    view: VdomFunctional<Path>;
    routes: Route[];
    path: string[];
}

export interface Route {
    parts: string[];
    subroutes: Router | null;
    component: null | RouteComponent;
}

export type RouteComponent = (vdom: VdomFunctional<Path, any>) => Vdom;

// Build a route map with respect to the parent route map
export const router = (routes: {[index: string]: Router | RouteComponent}, default_component: Vdom) => {
    const path = pathFromURL(window.location.pathname);
    
    const instance: Router = {
        parent: null,
        parent_path: [],
        view: v((vdom: VdomFunctional<Path>) => {
            if (vdom.instance === null) {
                vdom.shouldUpdate = shouldUpdate;
                vdom.props = {path: instance.path};
            }
            const component = resolve(instance, {path: instance.path});
            return component === null
                ? default_component
                : component
        }) as VdomFunctional<Path>,
        routes: [],
        path
    }

    instance.routes = Object.keys(routes).map(path => {
        const route = {
            parts: path.split("/").slice(1),
            subroutes: (typeof routes[path] === "object" ? routes[path] : null) as Router | null,
            component: (typeof routes[path] === "function" ? routes[path] : null) as RouteComponent | null
        }

        if (route.subroutes !== null) {
            route.subroutes.parent = instance;
            route.subroutes.parent_path = route.parts;
        }

        return route;
    });

    window.history.replaceState(path, "", window.location.pathname);
    window.onpopstate = (event: PopStateEvent) => {
        if (event.state !== null) {
            instance.path = event.state;
            redraw(instance.view);
        }
    }
    return instance;
}

// Create a link vdom
export const link = (router: Router, path: string, contents: Vdom | string) =>
    v("a", {onclick: {
        redraw: false,
        handler: () => {
            redraw(go(router, pathFromURL(path)))
        }
    }}, contents)

export const go = (router: Router, path: string[]): VdomFunctional<Path> => {
    if (router.parent !== null) {
        router.path = path;
        return go(router.parent, router.parent_path.concat(path));
    } else {
        router.path = path;
        window.history.pushState(path, "", "/" + path.join("/"))
        return router.view;
    }
}

const resolve = (router: Router, path: Path) => {
    for (const route of router.routes) {
        const matched_component = matchRoute(path.path as string[], route);
        if (matched_component !== null) {
            return matched_component;
        }
    }

    return null;
}

const matchRoute = (parts: string[], route: Route): null | Vdom => {
    if (route.parts.length > parts.length) return null;

    const params: Path = {path: [] as string[]};
    for (let index = 0; index < parts.length && index < route.parts.length; ++index) {
        if (route.parts[index] === "*") {
            return passToRoute(route, {...params, path: parts.slice(index)});
        } else if (route.parts[index].startsWith(":")) {
            params[route.parts[index].slice(1)] = parts[index];
        } else if (route.parts[index] !== parts[index]) {
            return null;
        }
    }

    if (params.path.length === 0)
        return passToRoute(route, {...params, path: parts.slice(route.parts.length)});
    else
        return null
}

const shouldUpdate = (o: Path, n: Path) => {
    for (const nk in n) {
        if (nk !== "path" && o[nk] !== n[nk]) return true;
    }

    if (o.path.length !== n.path.length) return true;

    for (let i = 0; i < o.path.length; ++i) {
        if (o.path[i] !== n.path[i]) return true;
    }

    return false;
}

const passToRoute = (route: Route, params: Path) => {
    if (route.component === null && route.subroutes !== null) {
        route.subroutes.path = params.path;
        const view = route.subroutes.view;
        redraw(view);
        return view;
    } else if (route.component !== null && route.subroutes === null) {
        return v(route.component, {props: params, shouldUpdate});
    }

    return null;
}

const pathFromURL = (url_string: string) => {
    return url_string.split("/").slice(1);
}
