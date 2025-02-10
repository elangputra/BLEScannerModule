//
//  NativeBLEManager.m
//  BLEScannerModule
//
//  Created by elang.sartika on 09/02/25.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(NativeBLEManager, NSObject)

RCT_EXTERN_METHOD(startScan)
RCT_EXTERN_METHOD(stopScan)

@end
