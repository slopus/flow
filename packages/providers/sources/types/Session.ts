import { StepArguments } from "./StepArguments.js";

export interface Session {
    step(args: StepArguments): { cancel: () => void };
}