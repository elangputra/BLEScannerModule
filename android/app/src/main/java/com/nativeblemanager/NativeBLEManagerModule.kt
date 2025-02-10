package com.blescannermodule

import com.nativeblemanager.NativeBLEManagerSpec
import com.facebook.react.bridge.ReactApplicationContext

class NativeBLEManagerModule(reactContext: ReactApplicationContext) : NativeBLEManagerSpec(reactContext) {

    override fun getName() = NAME

    override fun startScan() {
        print("Start Scanning...")
    }

    override fun stopScan() {
        print("Stop Scanning...")
    }

    companion object {
        const val NAME = "NativeBLEManager"
    }
}