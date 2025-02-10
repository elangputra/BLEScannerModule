//
//  NativeBLEManagerImpl.swift
//  BLEScannerModule
//
//  Created by elang.sartika on 09/02/25.
//

import Foundation
import React
import CoreBluetooth

@objc protocol NativeBLEManagerEventDelegate {
  func sendDevice(name: String, device: [String: Any])
  func sendBluetoothState(name: String, state: Int)
}

@objc(NativeBLEManagerImpl)
public final class NativeBLEManagerImpl: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
  @objc public static let NEARBY_DEVICE_KEY = "NearbyDevice"
  @objc public static let BLUETOOTH_STATE_KEY = "BluetoothState"
  @objc weak var delegate: NativeBLEManagerEventDelegate? = nil

  private var centralManager: CBCentralManager? = nil
  private var nearbyDevices: [String: [String: Any]] = [:]
  private var isConnected = false

  @objc
  public func supportedEvents() -> [String]! {
    return [NativeBLEManagerImpl.NEARBY_DEVICE_KEY, NativeBLEManagerImpl.BLUETOOTH_STATE_KEY]
  }
  
  @objc
  public func getEventKey() -> NSDictionary {
    return [
      "nearbyDevices": NativeBLEManagerImpl.NEARBY_DEVICE_KEY,
      "bluetoothState": NativeBLEManagerImpl.BLUETOOTH_STATE_KEY
    ]
  }

  @objc
  public func startScan() {
    if(centralManager != nil) {
      centralManager?.stopScan()
    }
    centralManager =  CBCentralManager(delegate: self, queue: nil)
    debugPrint("Bluetooth start scan")
  }

  @objc
  public func stopScan() {
    centralManager?.stopScan()
    centralManager = nil
    nearbyDevices = [:]
  }

  private func sendDevice(device: [String: Any]) {
    self.delegate?.sendDevice(name: NativeBLEManagerImpl.NEARBY_DEVICE_KEY, device: device)
  }

  private func sendBluetoothState(state: Int) {
    self.delegate?.sendBluetoothState(name: NativeBLEManagerImpl.BLUETOOTH_STATE_KEY, state: state)
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
      var manufacturerData: [String] = []
      if let mData = advertisementData[CBAdvertisementDataManufacturerDataKey] as? Data {
        manufacturerData = (String(data: mData, encoding: .utf8) ?? "").components(separatedBy: ":")
      }
      let data: [String: Any] = [
        "name": peripheral.name ?? "N/A",
        "address": "00:00:00:00:00:00", // iOS not supporting mac address
        "uuid": peripheral.identifier.uuidString,
        "rssi": RSSI,
        // "advertiseFlags": nil, // No data related Flags
        "txPowerLevel": advertisementData[CBAdvertisementDataTxPowerLevelKey] ?? 0,
        "manufacturerSpecificData": manufacturerData,
        "serviceUuids": peripheral.services?.map { service in service.uuid.uuidString } ?? []
      ]
      nearbyDevices[peripheral.identifier.uuidString] = data
      self.sendDevice(device: data)
    }
  }
}
