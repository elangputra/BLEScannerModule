//
//  NativeBLEManager.swift
//  BLEScannerModule
//
//  Created by elang.sartika on 09/02/25.
//

import Foundation
import React
import CoreBluetooth

@objc(NativeBLEManagerImpl)
public final class NativeBLEManager: RCTEventEmitter, CBCentralManagerDelegate, CBPeripheralDelegate {
  @objc public static let NEARBY_DEVICE_KEY = "NearbyDevice"
  @objc public static let BLUETOOTH_STATE_KEY = "BluetoothState"

  private var centralManager: CBCentralManager? = nil
  private var nearbyDevices: [String: CBPeripheral] = [:]
  private var isConnected = false

  // We dont use UIKit so we should set requiresMainQueueSetup to false
  @objc
  public override static func requiresMainQueueSetup() -> Bool {
      return false
  }

  public override func supportedEvents() -> [String]! {
    return [NativeBLEManager.NEARBY_DEVICE_KEY, NativeBLEManager.BLUETOOTH_STATE_KEY]
  }
  
  @objc
  public func getEventKey() -> NSDictionary {
    return [
      "nearbyDevices": NativeBLEManager.NEARBY_DEVICE_KEY,
      "bluetoothState": NativeBLEManager.BLUETOOTH_STATE_KEY
    ]
  }

  @objc
  public func startScan() {
    if(centralManager != nil) {
      centralManager?.stopScan()
    }
    centralManager =  CBCentralManager(delegate: self, queue: nil)
    print("Bluetooth start scan")
  }

  @objc
  public func stopScan() {
    centralManager?.stopScan()
    centralManager = nil
    nearbyDevices = [:]
  }
  
  @objc
  public func addListener(eventType: String) {
    // Required by RN Turbo Module https://github.com/react-native-community/RNNewArchitectureLibraries/tree/feat/swift-event-emitter?tab=readme-ov-file#codegen-update-codegen-specs
  }
  
  @objc
  public func removeListeners(count: Int) {
    // Required by RN Turbo Module https://github.com/react-native-community/RNNewArchitectureLibraries/tree/feat/swift-event-emitter?tab=readme-ov-file#codegen-update-codegen-specs
  }

  @objc
  private func sendDevice(device: CBPeripheral) {
    self.sendEvent(withName: NativeBLEManager.NEARBY_DEVICE_KEY, body: [
      "name": device.name!,
    ])
  }

  @objc
  private func sendBluetoothState(state: Int) {
    self.sendEvent(withName: NativeBLEManager.BLUETOOTH_STATE_KEY, body: state)
  }

  // MARK: Central Manager Methods
  public func centralManagerDidUpdateState(_ central: CBCentralManager) {
    sendBluetoothState(state: central.state.rawValue)

    switch (central.state) {
    case .poweredOn:
      debugPrint("Bluetooth is available")
      centralManager?.scanForPeripherals(withServices: [])
      break
    case .resetting, .poweredOff:
      debugPrint("Bluetooth is not available")
      break
    case .unauthorized:
      debugPrint("Bluetooth is unauthorized")
      break
    case .unsupported, .unknown:
      debugPrint("Bluetooth is not supported")
      break
    @unknown default:
      debugPrint("Bluetooth is unknown")
      break
    }
  }

  public func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
    if(peripheral.name != nil) {
      nearbyDevices[peripheral.name!] = peripheral
      self.sendDevice(device: peripheral)
    }
  }
}
