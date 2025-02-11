## BLE Scanner Documentation

### Overview
This project goal is to make a native module for searching BLE devices nearby. 

**Note**: We don't use any package related to bluetooth in this project.

| Android    | iOS |
| -------- | ------- |
|  https://drive.google.com/file/d/1HJT8As-oSAfMi9QBM0EEznuT0sA2R0og/preview | https://drive.google.com/file/d/1ZM00CTJsFQj5gPTbN932i6S3yXWri3Jc/preview  |

#### What tech did I use ?
- React Native
    - Turbo Native Module
- iOS
    - Objective-C
    - Swift
- Android
    - Kotlin

#### Features
- Scanning BLE Devices
- Search BLE by **name and address** (Android) or **name and UUID** (iOS)

### Spec

Currently we use Spec called `NativeBLEModule` that expose these method:

```
    // Start the scanning
    startScan(): void;
    // Stop the scanning
    stopScan(): void;
    // Get event name for RCTEventEmitter
    getEventKey(): EventKey;

    // Required from RN
    addListener: (eventType: string) => void;
    removeListeners: (count: number) => void;
```

#### Events
There are 2 events emitter in this module:
- **NearbyDevices**
this event will be used to update the list of nearby device found
- **BluetoothState**
this event will be used to update the bluetooth state

### Usage

1. First after connecting the native module, we need to create a class to maintain it's service. We create a service called `BluetoothService.tsx`

2. We need to set the model for the data that passed from `NearbyDevice` Event emitter
    ```
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
    ```
3. After that we need to add handling function for start scan, the main idea is this line of code in `BluetoothService.tsx`.
We use NativeEventEmitter to subscribe 2 events.
    ```
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
    ```

4. After that we need to add handling for stop scan. In this function we remove the subscription that we use in start scan function. Actually we can use this service as it is, but for performance reason we can add RTK Query api to use caching in this service.
    ```
    const {NativeBLEManager} = NativeModules;
    NativeBLEManager.stopScan();

    if ((eventSubs ?? []).length > 0) {
        (eventSubs ?? []).forEach((eventSub: EmitterSubscription) => {
            eventSub.remove()
        })
    }
    ```
5. We use RTK query api like this in `discoverNearbyDevicesAPI.tsx`. Here we are using onCacheEntryAdded lifecycle so the scanning will be updated in realtime.
    ```
    async onCacheEntryAdded(_, api) {
        await api.cacheDataLoaded;

        let data: DeviceAPIResponse = {devices: [], isScanning: false}
        let devices: Record<string, BluetoothService.BLEDeviceData> = {};
        const subs = await BluetoothService.startScanForDevices(
            (device: BluetoothService.BLEDeviceData) => {
                const index = Platform.OS == "android" ? device.address : device.uuid
                devices[index] = {
                    ...device,
                    name: device.name ?? "N/A"
                }
                data = {
                    ...data,
                    devices: [...Object.values(devices)]
                }
                api.updateCachedData(() => data);
            },
            (progressData: BluetoothService.ProgressData | undefined) => {
                if (progressData != undefined) {
                    data = {
                        ...data,
                        isScanning: progressData?.isScanning ?? data.isScanning,
                        progressMessage: {
                            title: progressData.title,
                            message: progressData.message
                        }
                    } 
                    api.updateCachedData(() => data);
                }
            }
        );

        if (subs.length > 0) {
            await api.cacheEntryRemoved
            BluetoothService.stopScanForDevices(subs);
        }
    },
    ```
6. After all of these things is set we use it in our pages by calling api by using **trigger** function and listening to the data provided.
    ```
    const [trigger, { data }] = discoverNearbyDevicesAPI.useLazyScanQuery()
    ```
7. Some of additional handling can be added in BluetoothService such as permission handling and state change handling
