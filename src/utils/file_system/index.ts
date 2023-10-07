import * as fs from "fs";
import * as path from "path";

import { Result } from "../types/result_type";
import { BetProviderGameConfig } from "../types/common";
import { BetProvider } from "../../bet_providers";
import { getConfig } from "../..";

const {logger} = getConfig();

export function getRawHtmlDirectoryStorageName(betProvider: BetProvider, gameConfig: BetProviderGameConfig): string {
    const directoryName = `data/raw_html/${betProvider.name}/${gameConfig.name.replace(" ", "")}/`;
    logger.trace("Ensuring directory existence for the following path: ", directoryName);
    ensureDirectoryExistence(directoryName);
    return directoryName;
}

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
 * Use function to write content to a file. 
 * Can fail if the chosen directory from root does not exist. You may need to
 * invoke `ensureDirectoryExistence` before calling this function.
 * @param filePathFromRoot
 * @param data 
 * @returns 
 */
export async function writeFileAsync(filePathFromRoot: string, data: string): Promise<Result<boolean, Error>> {
    return new Promise(resolve => {
        fs.writeFile(filePathFromRoot, data, (err) => {
            if (err) {
                resolve({result: "error", value: Error(err.message)});
            } else {
                resolve({result: "success", value: true});
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