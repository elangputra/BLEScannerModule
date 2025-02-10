//
//  RCTNativeBLEManager.mm
//  BLEScannerModule
//
//  Created by elang.sartika on 09/02/25.
//

#import "RCTNativeBLEManager.h"
#import "BLEScannerModule-Swift.h"

//@interface RCT_EXTERN_REMAP_MODULE(RCTNativeBLEManager, NativeBLEManagerImpl, RCTEventEmitter)
//RCT_EXTERN_METHOD(startScan)
//RCT_EXTERN_METHOD(stopScan)
//RCT_EXTERN_METHOD(getEventKey)
//
//RCT_EXTERN_METHOD(addListener)
//RCT_EXTERN_METHOD(removeListeners)
//@end
@interface RCTNativeBLEManager()<NativeBLEManagerEventDelegate>
@property (strong, nonatomic) NativeBLEManagerImpl *nativeBLEManagerImpl;
@end

@implementation RCTNativeBLEManager

RCT_EXPORT_MODULE(NativeBLEManager)

- (id) init {
  if (self = [super initWithDisabledObservation]) {
    _nativeBLEManagerImpl = [[NativeBLEManagerImpl alloc] init];
    _nativeBLEManagerImpl.delegate = self;
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeBLEManagerSpecJSI>(params);
}

- (void)addListener:(nonnull NSString *)eventType { 
  // Required by RN Turbo Module https://github.com/react-native-community/RNNewArchitectureLibraries/tree/feat/swift-event-emitter?tab=readme-ov-file#codegen-update-codegen-specs
}

- (NSDictionary *)getEventKey {
  return [self.nativeBLEManagerImpl getEventKey];
}

- (void)removeListeners:(double)count { 
  // Required by RN Turbo Module https://github.com/react-native-community/RNNewArchitectureLibraries/tree/feat/swift-event-emitter?tab=readme-ov-file#codegen-update-codegen-specs
}

- (void)startScan {
  [self.nativeBLEManagerImpl startScan];
}

- (void)stopScan { 
  [self.nativeBLEManagerImpl stopScan];
}

// MARK: RCTEventEmitter Related

- (NSArray<NSString *> *)supportedEvents {
  return [self.nativeBLEManagerImpl supportedEvents];
}

- (void)sendBluetoothStateWithName:(NSString * _Nonnull)name state:(NSInteger)state { 
  [self sendEventWithName:name body:@(state)];
}

- (void)sendDeviceWithName:(NSString * _Nonnull)name device:(NSDictionary<NSString *,id> * _Nonnull)device { 
  [self sendEventWithName:name body:device];
}


@end
