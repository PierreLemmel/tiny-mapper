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
    private listeners = new Set<(event: AppEvent) => void>();

    private handlerKey(category: string, type: string): string {
        return `${category}.${type}`;
    }

    push<E extends AppEvent>(event: E): void {
        if (this.cursor < this.events.length - 1) {
            this.events = this.events.slice(0, this.cursor + 1);
        }
        this.events.push(event);
        this.cursor++;
        this.listeners.forEach(l => l(event));
    }

    undo(): boolean {
        if (!this.canUndo) return false;

        const event = this.events[this.cursor];
        const handler = this.handlers.get(this.handlerKey(event.category, event.type));
        if (handler) handler.backward(event.backwardData);
        this.cursor--;
        return true;
    }

    redo(): boolean {
        if (!this.canRedo) return false;
        this.cursor++;
        const event = this.events[this.cursor];
        const handler = this.handlers.get(this.handlerKey(event.category, event.type));
        if (handler) handler.forward(event.forwardData);
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

    subscribe(listener: (event: AppEvent) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    get canUndo(): boolean {
        return this.cursor >= 0;
    }

    get canRedo(): boolean {
        return this.cursor < this.events.length - 1;
    }
}

export const eventStore = new EventStore();
