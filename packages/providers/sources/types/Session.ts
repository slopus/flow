import { SessionUpdate } from "./SessionUpdate.js";
import { StepArguments } from "./StepArguments.js";

export interface Session {
    step(args: StepArguments): AsyncIterable<SessionUpdate>;
}