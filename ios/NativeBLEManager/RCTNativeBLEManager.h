//
//  RCTNativeBLEManager.h
//  BLEScannerModule
//
//  Created by elang.sartika on 09/02/25.
//

#import <Foundation/Foundation.h>
#import <NativeBLEManagerSpec/NativeBLEManagerSpec.h>
#import <RCTAppDelegate.h>
#import <React/RCTEventEmitter.h>
#import <CoreBluetooth/CBCentralManager.h>
#import <CoreBluetooth/CBPeripheral.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTNativeBLEManager: RCTEventEmitter<NativeBLEManagerSpec>

@end

NS_ASSUME_NONNULL_END
