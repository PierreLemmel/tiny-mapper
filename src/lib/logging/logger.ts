export const LogLevel = {
    Verbose: 0,
    Debug: 1,
    Info: 2,
    Warn: 3,
    Error: 4,
} as const;

export type LogLevelValue = (typeof LogLevel)[keyof typeof LogLevel];

let minLevel: LogLevelValue = LogLevel.Debug;

export function setLogLevel(level: LogLevelValue): void {
    minLevel = level;
}

export function getLogLevel(): LogLevelValue {
    return minLevel;
}

const levelNames: Record<LogLevelValue, string> = {
    [LogLevel.Verbose]: "VERBOSE",
    [LogLevel.Debug]: "DEBUG",
    [LogLevel.Info]: "INFO",
    [LogLevel.Warn]: "WARN",
    [LogLevel.Error]: "ERROR",
};

function write(level: LogLevelValue, args: unknown[], scope?: string): void {
    if (level < minLevel) {
        return;
    }
    const label = `[${levelNames[level]}]`;
    if (scope !== undefined) {
        console.log(label, `[${scope}]`, ...args);
    } else {
        console.log(label, ...args);
    }
}

export const log = {
    verbose(...args: unknown[]) {
        write(LogLevel.Verbose, args);
    },
    debug(...args: unknown[]) {
        write(LogLevel.Debug, args);
    },
    info(...args: unknown[]) {
        write(LogLevel.Info, args);
    },
    warn(...args: unknown[]) {
        write(LogLevel.Warn, args);
    },
    error(...args: unknown[]) {
        write(LogLevel.Error, args);
    },
};

export function createLogger(scope: string) {
    return {
        verbose(...args: unknown[]) {
            write(LogLevel.Verbose, args, scope);
        },
        debug(...args: unknown[]) {
            write(LogLevel.Debug, args, scope);
        },
        info(...args: unknown[]) {
            write(LogLevel.Info, args, scope);
        },
        warn(...args: unknown[]) {
            write(LogLevel.Warn, args, scope);
        },
        error(...args: unknown[]) {
            write(LogLevel.Error, args, scope);
        },
    };
}

export type Logger = typeof log;
