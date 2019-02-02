import big_flat_benchmarks from "./big-flat-benchmarks";
import subprocedure_benchmarks from "./subprocedure_benchmarks";
import merge from "deepmerge";

export default merge(
    big_flat_benchmarks,
    subprocedure_benchmarks,
    {}
)