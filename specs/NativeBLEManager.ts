import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

interface EventKey {
    nearbyDevices: string;
    bluetoothState: string;
}

export interface Spec extends TurboModule {
    startScan(): void;
    stopScan(): void;
    getEventKey(): EventKey;

    addListener: (eventType: string) => void;
    removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
    'NativeBLEManager',
);