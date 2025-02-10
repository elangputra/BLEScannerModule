import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { BluetoothService } from "../services/BluetoothService";
import { Platform } from "react-native";

export interface DeviceAPIResponse {
    progressMessage?: {
        title: string,
        message: string
    };
    isScanning: boolean;
    devices: BluetoothService.BLEDeviceData[];
}

export const discoverNearbyDevicesAPI = createApi({
    reducerPath: 'discoverNearbyDevicesAPI',
    baseQuery: fakeBaseQuery(),
    endpoints: api => ({
        scan: api.query<DeviceAPIResponse, void>({
            queryFn: () => {
                return { data: {
                    isScanning: false,
                    devices: []
                }};
            },
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
        })
    })
})