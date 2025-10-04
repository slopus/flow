import { ModelDescriptor } from "./ModelDescriptor.js";
import { Session } from "./Session.js";

export interface ModelProvider {
    readonly name: string;
    readonly displayName: string;
    models(): Promise<ModelDescriptor[]>;
    createSession(model: string): Promise<Session>;
}