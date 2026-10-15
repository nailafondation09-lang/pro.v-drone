import { EventEmitter } from 'node:events';
import { InterceptionAction } from '../common/enums.js';
export interface InterceptCommand {
    droneId: string;
    missionId: string | null;
    action: InterceptionAction;
}
export declare class FleetBus extends EventEmitter {
    intercept(cmd: InterceptCommand): void;
    missionStarted(missionId: string): void;
}
