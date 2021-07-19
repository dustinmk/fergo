
export type Benchmark = (elem: HTMLElement) => Promise<{
    name: string,
    time: number
}>;

export interface BenchmarkResult {
    name: string;
    time: number;
}

export interface BenchmarkSet {
    results: {[index: string]: BenchmarkResult},
    name: string;
}