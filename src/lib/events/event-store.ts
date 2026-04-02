export type AppEvent<
    TCategory extends string = string,
    TType extends string = string,
    TForward = unknown,
    TBackward = unknown
> = {
    category: TCategory;
    type: TType;
    forwardData: TForward;
    backwardData: TBackward;
}

type EventHandler = {
    forward: (data: any) => void;
    backward: (data: any) => void;
}

export class EventStore {
    private events: AppEvent[] = [];
    private cursor: number = -1;
    private handlers = new Map<string, EventHandler>();

    private pushListeners = new Set<(event: AppEvent) => void>();
    private undoListeners = new Set<(event: AppEvent) => void>();
    private redoListeners = new Set<(event: AppEvent) => void>();

    private handlerKey(category: string, type: string): string {
        return `${category}.${type}`;
    }

    push<E extends AppEvent>(event: E): void {
        if (this.cursor < this.events.length - 1) {
            this.events = this.events.slice(0, this.cursor + 1);
        }
        this.events.push(event);
        this.cursor++;
        this.pushListeners.forEach(l => l(event));
    }

    undo(): boolean {
        if (!this.canUndo) return false;

        const event = this.events[this.cursor];
        const handler = this.handlers.get(this.handlerKey(event.category, event.type));
        if (handler) handler.backward(event.backwardData);
        this.cursor--;
        this.undoListeners.forEach(l => l(event));
        return true;
    }

    redo(): boolean {
        if (!this.canRedo) return false;
        this.cursor++;
        const event = this.events[this.cursor];
        const handler = this.handlers.get(this.handlerKey(event.category, event.type));
        if (handler) handler.forward(event.forwardData);
        this.redoListeners.forEach(l => l(event));
        return true;
    }

    registerHandler<E extends AppEvent>(
        category: E["category"],
        type: E["type"],
        forward: (data: E["forwardData"]) => void,
        backward: (data: E["backwardData"]) => void
    ): void {
        this.handlers.set(this.handlerKey(category, type), { forward, backward });
    }

    on<E extends "push"|"undo"|"redo">(event: E, listener: (event: AppEvent) => void): () => void {
        switch (event) {
            case "push":
                this.pushListeners.add(listener);
                return () => this.pushListeners.delete(listener);
            case "undo":
                this.undoListeners.add(listener);
                return () => this.undoListeners.delete(listener);
            case "redo":
                this.redoListeners.add(listener);
                return () => this.redoListeners.delete(listener);
        }
    }


    get canUndo(): boolean {
        return this.cursor >= 0;
    }

    get canRedo(): boolean {
        return this.cursor < this.events.length - 1;
    }
}

export const eventStore = new EventStore();
