import { get } from "svelte/store";
import { log } from "../logging/logger";
import { applicationSettings } from "../stores/settings";

export type TickProps = {
    time: number;
    deltaTime: number;
}

export type TickerListener = (props: TickProps) => void;

export class Ticker {

    private listeners = new Set<TickerListener>();
    private _refreshRate: number;

    constructor(refreshRate: number) {
        this._refreshRate = refreshRate;
    }

    public get refreshRate(): number {
        return this._refreshRate;
    }

    public set refreshRate(refreshRate: number) {
        this._refreshRate = refreshRate;
    }

    private _isRunning = false;
    private _startTime: number = 0;
    private _lastTime: number = 0;

    public start() {

        this._startTime = performance.now();
        this._lastTime = this._startTime;

        if (this._isRunning) {
            log.error("Ticker is already running");
            return;
        }
        
        this._isRunning = true;
        this.goToNextTick();
    }

    private goToNextTick() {
        setTimeout(() => {
            const time = performance.now();
            const deltaTime = (time - this._lastTime) / 1000;
            this._lastTime = time;
            
            const props: TickProps = {
                time: time / 1000,
                deltaTime,
            };
            this.listeners.forEach(listener => listener(props));
            this.goToNextTick();
        }, 1000 / this._refreshRate);
    }

    public addListener(listener: TickerListener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    public removeListener(listener: TickerListener) {
        this.listeners.delete(listener);
    }
}

export const ticker = new Ticker(60);
export const initializeGlobalTicker = () => {
  
    applicationSettings.subscribe((settings) => {
        ticker.refreshRate = settings.refreshRate;
    });
    ticker.start();

    return ticker;
}