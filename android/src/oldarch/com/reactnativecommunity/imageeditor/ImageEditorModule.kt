package com.reactnativecommunity.imageeditor

import com.facebook.imagepipeline.core.ImagePipeline
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.views.image.ReactCallerContextFactory

@ReactModule(name = ImageEditorModule.NAME)
class ImageEditorModule : ReactContextBaseJavaModule {
    private val moduleImpl: ImageEditorModuleImpl

    constructor(reactContext: ReactApplicationContext) : super(reactContext) {
        moduleImpl = ImageEditorModuleImpl(reactContext, this, null, null)
    }

    constructor(reactContext: ReactApplicationContext, callerContext: Any?) : super(reactContext) {
        moduleImpl = ImageEditorModuleImpl(reactContext, callerContext, null, null)
    }

    constructor(
        reactContext: ReactApplicationContext,
        imagePipeline: ImagePipeline?,
        callerContextFactory: ReactCallerContextFactory?
    ) : super(reactContext) {
        moduleImpl = ImageEditorModuleImpl(reactContext, null, callerContextFactory, imagePipeline)
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
