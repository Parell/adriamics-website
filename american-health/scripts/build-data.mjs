import { buildDataContract } from "./data-contract.mjs";

const allowYearRegression = process.argv.includes("--allow-year-regression");

await buildDataContract({ allowYearRegression });

console.log("American Health data contract built successfully.");

