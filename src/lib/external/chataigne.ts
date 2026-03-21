export type ChataigneMessage<T extends string, D = unknown> = {
    type: T;
    id: number;
    data: D;
};
