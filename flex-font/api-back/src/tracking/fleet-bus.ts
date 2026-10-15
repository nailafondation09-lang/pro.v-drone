import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { InterceptionAction } from '../common/enums.js';

export interface InterceptCommand {
  droneId: string;
  missionId: string | null;
  action: InterceptionAction;
}

/**
 * Bus interne entre l'API (ordres) et la source de télémétrie.
 * Le simulateur l'écoute aujourd'hui ; une passerelle MAVLink pourra le faire demain.
 */
@Injectable()
export class FleetBus extends EventEmitter {
  intercept(cmd: InterceptCommand) {
    this.emit('intercept', cmd);
  }
  missionStarted(missionId: string) {
    this.emit('mission.started', missionId);
  }
}
