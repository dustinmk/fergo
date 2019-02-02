import {v, ComponentAttributes} from "minim";
import {Row} from "./big-table-row";

const RowComponent = (vdom: ComponentAttributes<{row: Row}, {}>) => {
    const row = vdom.props.row;

    return v("tr", [
        v("td", row.name),
        v("td", row.street),
        v("td", row.city),
        v("td", row.phone),
        v("td", row.occupation),
        v("td", row.chicken_ownership),
        v("td", row.first_person_seen),
        v("td", row.harp_position),
    ]);
}

export default (props: {rows: Row[]}) => v(() => v("table", props.rows.map(row =>
    v(RowComponent, {props: {row}})
)));