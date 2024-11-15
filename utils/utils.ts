import { Logger } from 'pino';
import dotenv from 'dotenv';

dotenv.config();

export const retrieveEnvVariable = (variableName: string, logger: Logger) => {
  const variable = process.env[variableName] || '';
  if (!variable) {
    console.log(`${variableName} is not set`);
    process.exit(1);
  }
  return variable;
};


// Define the type for the JSON file content
export interface Data {
  privateKey: string;
  pubkey: string;
}

export const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}


export function deleteConsoleLines(numLines: number) {
  for (let i = 0; i < numLines; i++) {
    process.stdout.moveCursor(0, -1); // Move cursor up one line
    process.stdout.clearLine(-1);        // Clear the line
  }
}


