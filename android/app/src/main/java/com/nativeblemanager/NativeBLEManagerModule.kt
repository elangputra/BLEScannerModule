package com.nativeblemanager

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanRecord
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.UUID


class NativeBLEManagerModule(private val reactContext: ReactApplicationContext) : NativeBLEManagerSpec(reactContext) {
    object EventData {
        const val NEARBY_DEVICE_KEY = "NearbyDevice"
        const val BLUETOOTH_STATE_KEY = "BluetoothState"

        const val BT_UNSUPPORTED = 2
        const val BT_POWER_OFF = 4
        const val BT_POWER_ON = 5
    }

    private var scanner: BluetoothLeScanner? = null

    override fun getName() = NAME

    private val mReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val action = intent.action

            if (BluetoothAdapter.getDefaultAdapter() == null) {
                sendBluetoothState(EventData.BT_UNSUPPORTED)
            } else if (action == BluetoothAdapter.ACTION_STATE_CHANGED) {
                val state = intent.getIntExtra(
                    BluetoothAdapter.EXTRA_STATE,
                    BluetoothAdapter.ERROR
                )
                when (state) {
                    BluetoothAdapter.STATE_OFF -> sendBluetoothState(EventData.BT_POWER_OFF)
                    BluetoothAdapter.STATE_ON -> sendBluetoothState(EventData.BT_POWER_ON)
                }
            }
        }
    }

    private val bleCallback = object : ScanCallback() {
        @SuppressLint("MissingPermission")

        override fun onScanResult(callbackType: Int, result: ScanResult) {
            result.device?.let { device ->
                val params: WritableMap = Arguments.createMap()
                params.putString("name", device.name)
                params.putString("uuid", UUID.nameUUIDFromBytes(result.scanRecord?.bytes).toString())
                params.putString("address", device.address)
                params.putInt("rssi", result.rssi)
                result.scanRecord?.txPowerLevel?.let { params.putInt("txPowerLevel", it) }
                result.scanRecord?.advertiseFlags?.let { params.putInt("advertiseFlags", it) }
                result.scanRecord?.serviceUuids?.let {
                    val arr = it.map { item -> item.uuid.toString() }.toTypedArray()
                    params.putArray("serviceUuids", Arguments.fromArray(arr))
                }
                result.scanRecord?.manufacturerSpecificData?.let {
                    val manufacturerIds: MutableList<String> = ArrayList()
                    for (i in 0 until it.size()) {
                        manufacturerIds.add("${it.keyAt(i)}=${it.get(it.keyAt(i))}")
                    }
                    params.putArray("manufacturerSpecificData", Arguments.fromList(manufacturerIds.toList()))
                }
                sendNearbyDevice(params)
            }
        }
    }

    @SuppressLint("MissingPermission")
    override fun startScan() {
        val filter = IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED)
        reactContext.applicationContext.registerReceiver(mReceiver, filter)

        val mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        if (mBluetoothAdapter == null) {
            // Bluetooth is not supported
            sendBluetoothState(EventData.BT_UNSUPPORTED)
        } else if (!mBluetoothAdapter.isEnabled) {
            // Bluetooth is not enabled
            sendBluetoothState(EventData.BT_POWER_OFF)
        } else {
            sendBluetoothState(EventData.BT_POWER_ON)
            scanner = mBluetoothAdapter.bluetoothLeScanner

            scanner?.let {
                val filters = mutableListOf<ScanFilter>()
                val settings = ScanSettings.Builder()
                    .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                    .build()

                it.startScan(filters, settings, bleCallback)
            }
        }
    }

    override fun getEventKey(): WritableMap {
        val params: WritableMap = Arguments.createMap()
        params.putString("nearbyDevices", EventData.NEARBY_DEVICE_KEY)
        params.putString("bluetoothState", EventData.BLUETOOTH_STATE_KEY)

        return params
    }

    override fun addListener(eventType: String?) {
        // Required by RN Turbo Module https://github.com/react-native-community/RNNewArchitectureLibraries/tree/feat/swift-event-emitter?tab=readme-ov-file#codegen-update-codegen-specs
    }

    override fun removeListeners(count: Double) {
        // Required by RN Turbo Module https://github.com/react-native-community/RNNewArchitectureLibraries/tree/feat/swift-event-emitter?tab=readme-ov-file#codegen-update-codegen-specs
    }

    @SuppressLint("MissingPermission")
    override fun stopScan() {
        scanner?.let {
            it.stopScan(bleCallback)
            scanner = null
        }
        reactContext.applicationContext.unregisterReceiver(mReceiver)
    }

    private fun sendNearbyDevice(params: WritableMap?) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EventData.NEARBY_DEVICE_KEY, params)
    }

    private fun sendBluetoothState(state: Int) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EventData.BLUETOOTH_STATE_KEY, state)
    }

    companion object {
        const val NAME = "NativeBLEManager"
    }
}