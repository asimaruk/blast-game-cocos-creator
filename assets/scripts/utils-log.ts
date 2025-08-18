export function log(message?: any, ...optionalParams: any[]): void {
    if (CC_DEBUG) {
        if (optionalParams.length === 0) {
            console.log(message);
        } else {
            console.log(message, optionalParams);
        }
    }
}

export function warn(message?: any, ...optionalParams: any[]): void {
    if (CC_DEBUG) {
        if (optionalParams.length === 0) {
            console.warn(message);
        } else {
            console.warn(message, optionalParams);
        }
    }
}