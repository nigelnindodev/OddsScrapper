import * as fs from "fs";

import { Result } from "../types/result_type";

export async function readFileAsync(filePathFromRoot: string): Promise<Result<string,Error>> {
    return new Promise(resolve => {
        fs.readFile(filePathFromRoot, (err,buffer) => {
            if (err) {
                resolve({result: "error", value: Error(err.message)});
            } else {
                resolve({result: "success", value: buffer.toString()});
            }
        });
    });
}