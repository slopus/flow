import { AsyncLock } from "@slopus/helpers";

export type PendingPermission = {
    id: string;
    toolName: string;
    parameters: any;
    resolve: (approved: boolean) => void;
};

export class PermissionManager {
    private queue: PendingPermission[] = [];
    private lock = new AsyncLock();
    private onPermissionChange?: (permission: PendingPermission | null) => void;

    constructor(onPermissionChange?: (permission: PendingPermission | null) => void) {
        this.onPermissionChange = onPermissionChange;
    }

    async requestPermission(toolName: string, parameters: any): Promise<boolean> {
        return this.lock.inLock(async () => {
            const id = Math.random().toString(36).substring(7);

            return new Promise<boolean>((resolve) => {
                const permission: PendingPermission = {
                    id,
                    toolName,
                    parameters,
                    resolve,
                };

                this.queue.push(permission);

                // Notify only if this is the first permission (now at front of queue)
                if (this.queue.length === 1 && this.onPermissionChange) {
                    this.onPermissionChange(permission);
                }
            });
        });
    }

    approve(id: string): void {
        const permission = this.queue.find(p => p.id === id);
        if (!permission) return;

        permission.resolve(true);
        this.removePermission(id);
    }

    deny(id: string): void {
        const permission = this.queue.find(p => p.id === id);
        if (!permission) return;

        permission.resolve(false);
        this.removePermission(id);
    }

    private removePermission(id: string): void {
        const index = this.queue.findIndex(p => p.id === id);
        if (index === -1) return;

        this.queue.splice(index, 1);

        // Notify about next permission in queue
        if (this.onPermissionChange) {
            this.onPermissionChange(this.queue[0] || null);
        }
    }

    getCurrentPermission(): PendingPermission | null {
        return this.queue[0] || null;
    }

    getQueueLength(): number {
        return this.queue.length;
    }
}
