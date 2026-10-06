package com.reactnativecommunity.imageeditor

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = ImageEditorModule.NAME)
class ImageEditorModule(reactContext: ReactApplicationContext) :
    NativeRNCImageEditorSpec(reactContext) {
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

    override fun cropImage(uri: String, cropData: ReadableMap, promise: Promise) {
        moduleImpl.cropImage(uri, cropData, promise)
    }

    companion object {
        const val NAME = ImageEditorModuleImpl.NAME
    }
}
