import {
    EmitterSubscription,
    NativeEventEmitter,
    NativeModules,
    PermissionsAndroid,
    Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { discoverNearbyDevicesAPI } from '../api/discoverNearbyDevicesAPI';

export namespace BluetoothService {
    export interface BLEDeviceData {
        name: string;
        address: string;
        uuid: string;
        rssi: number;
        advertiseFlags?: number;
        txPowerLevel?: number;
        manufacturerSpecificData?: string[];
        serviceUuids?: string[];
    }

    export interface ProgressData {
        title: string;
        message: string;
        isScanning?: boolean;
    }

    const eventEmitter = new NativeEventEmitter(NativeModules.NativeBLEManager);

    const handlePermissionCheck = async (cb: (granted: boolean) => void) => {
        if (Platform.OS === 'android') {
            try {
                const fineLocationPermission = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                );
            
                const bluetoothPermissions = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                ]);
            
                const allPermissionsGranted = 
                    fineLocationPermission === PermissionsAndroid.RESULTS.GRANTED &&
                    bluetoothPermissions[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
                    bluetoothPermissions[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;

                cb(allPermissionsGranted);
            } catch (error) {
                cb(false);
            }
        } else {
            cb(true);
        }
    };


    // Bluetooth State
    //    unknown = 0
    //    resetting = 1
    //    unsupported = 2
    //    unauthorized = 3
    //    poweredOff = 4
    //    poweredOn = 5
    const handleUpdateChange = (bluetoothState: number): ProgressData | undefined => {
        switch (bluetoothState) {
            case 0:
            case 2:
                return {
                    title: "Device not Supported!",
                    message: "Sorry, this device is not supported.",
                    isScanning: false
                }
            case 1:
                return {
                    title: "Bluetooth is resetting",
                    message: "Please wait until your bluetooth turned on to use this application.",
                    isScanning: false
                }
            case 3:
                return {
                    title: 'Permissions not granted!', 
                    message: 'Please accept all requested permission to use this application.' ,
                    isScanning: false
                }
            case 4:
                return {
                    title: "Bluetooth is turned off",
                    message: "Please turned on your bluetooth to use this application.",
                    isScanning: false
                }
            case 5:
                return { 
                    title: 'Scanning...', 
                    message: 'Please kindly wait while we scan the nearby devices.' ,
                    isScanning: true
                }
            default:
                return undefined
        }
    }

    export async function startScanForDevices(callback: (device: BLEDeviceData) => void, progressCallback: (data: ProgressData | undefined) => void): Promise<EmitterSubscription[]> {
        let subscription: EmitterSubscription[] = []
        
        await handlePermissionCheck((granted) => {
            if (granted) {
                try {
                    const eventListener = (event: any) => {
                        callback(event as BLEDeviceData);
                    };

                    const bluetoothStateListener = (bluetoothState: number) => {
                        progressCallback(handleUpdateChange(bluetoothState))
                    };
            
                    const {NativeBLEManager} = NativeModules;
                    const { nearbyDevices, bluetoothState } = NativeBLEManager.getEventKey()
                    NativeBLEManager.startScan();

                    subscription = [
                        eventEmitter!.addListener(nearbyDevices, eventListener),
                        eventEmitter!.addListener(bluetoothState, bluetoothStateListener)
                    ];
                } catch(error) {
                    progressCallback({ 
                        title: 'Something went wrong!', 
                        message: 'Oops something went wrong when scanning the bluetooth.',
                        isScanning: false
                    })
                    subscription = []
                }
            } else {
                progressCallback({ 
                    title: 'Permissions not granted!', 
                    message: 'Please accept permission for location and nearby devices to use this application.',
                    isScanning: false
                })
                subscription = []
            }
        })

        return subscription
    }

    export function stopScanForDevices(eventSubs?: EmitterSubscription[]) {
        const {NativeBLEManager} = NativeModules;
        NativeBLEManager.stopScan();

        if ((eventSubs ?? []).length > 0) {
            (eventSubs ?? []).forEach((eventSub: EmitterSubscription) => {
                eventSub.remove()
            })
        }
    }
}