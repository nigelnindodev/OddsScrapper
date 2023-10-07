import * as fs from "fs";
import * as path from "path";

import { Result } from "../types/result_type";

/**
 * Read a file and return ints contents as a string.
 * Great for open structured text such as html and csv files.
 * @param filePathFromRoot 
 * @returns 
 */
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

/**
 * From https://stackoverflow.com/a/34509653
 * Ensure that a directory we want to write to already exists, else the write will fail.
 * @param filePathFromRoot
 */
export function ensureDirectoryExistence(filePathFromRoot: string): boolean {
    const dirName = path.dirname(filePathFromRoot);
    if (fs.existsSync(dirName)) {
        return true;
    }
    ensureDirectoryExistence(dirName);
    fs.mkdirSync(dirName);
    return true;
}