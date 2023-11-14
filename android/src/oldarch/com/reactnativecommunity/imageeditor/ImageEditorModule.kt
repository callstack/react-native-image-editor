package com.reactnativecommunity.imageeditor

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = ImageEditorModule.NAME)
class ImageEditorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    private val moduleImpl: ImageEditorModuleImpl

    init {
        moduleImpl = ImageEditorModuleImpl(reactContext)
    }

    override fun getName(): String {
        return ImageEditorModuleImpl.NAME
    }

    override fun invalidate() {
        moduleImpl.invalidate()
        super.invalidate()
    }

    @ReactMethod
    fun cropImage(uri: String, options: ReadableMap, promise: Promise) {
        moduleImpl.cropImage(uri, options, promise)
    }

    companion object {
        const val NAME = ImageEditorModuleImpl.NAME
    }
}
