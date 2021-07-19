//import bigTable from "./big-benchmarkjs-table";
import bigTable from "../templates/big-performance-table";
import {Benchmark} from "../benchmark-data";
import flatTableGenerator from "../generators/flat-table-generator";
import componentTableGenerator from "../generators/component-table-generator";
import rowWithEventHandlerGenerator from "../generators/row-with-event-handler-generator";
import rowWithStaticEventHandlerGenerator from "../generators/row-with-static-event-handler-generator";

const bigFlatTable = bigTable(flatTableGenerator);
const bigComponentTable = bigTable(componentTableGenerator);
const eventHandlerTable = bigTable(rowWithEventHandlerGenerator);
const staticEventHandlerTable = bigTable(rowWithStaticEventHandlerGenerator);

export default {
    "insert_rows": bigFlatTable("Insert 100 rows into 1000", (rows, new_rows) => {
        rows.splice(rows.length / 2, 0, ...new_rows);
        return rows;
    }),
    "append_rows": bigFlatTable("Append 100 rows to 1000", (rows, new_rows) => {
        return rows.concat(new_rows);
    }),
    "insert_one_row": bigFlatTable("Insert a single row", (rows, new_rows) => {
        rows.splice(rows.length / 2, 0, new_rows[0]);
        return rows;
    }),
    "delete_one_row": bigFlatTable("Delete a single row", (rows, _) => {
        rows.splice(rows.length / 2, 1);
        return rows;
    }),
    "insert_rows_component": bigComponentTable("Insert 100 rows into 1000: Component", (rows, new_rows) => {
        rows.splice(rows.length / 2, 0, ...new_rows);
        return rows;
    }),
    "append_rows_component": bigComponentTable("Append 100 rows to 1000: Component", (rows, new_rows) => {
        return rows.concat(new_rows);
    }),
    "insert_one_row_component": bigComponentTable("Insert a single row: Component", (rows, new_rows) => {
        rows.splice(rows.length / 2, 0, new_rows[0]);
        return rows;
    }),
    "update_single_row_component": bigComponentTable("Update single row of 1000: Component", (rows, new_rows) => {
        rows[rows.length / 2] = new_rows[0];
        return rows;
    }),
    "delete_one_row_component": bigComponentTable("Delete a single row: Component", (rows, _) => {
        rows.splice(rows.length / 2, 1);
        return rows;
    }),
    "append_with_static_event_handler": staticEventHandlerTable("Static event handler append 100", (rows, new_rows) => {
        return rows.concat(new_rows);
    }),
    "append_with_inline_event_handler": eventHandlerTable("Inline event handler append 100", (rows, new_rows) => {
        return rows.concat(new_rows);
    }),
    
} as {[index: string]: Benchmark}