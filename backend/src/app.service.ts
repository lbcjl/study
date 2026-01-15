import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'TravelGenie Backend',
      version: '0.0.1',
      timestamp: new Date().toISOString(),
    };
  }
}
