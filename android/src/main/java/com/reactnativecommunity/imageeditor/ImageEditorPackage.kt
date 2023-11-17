/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.reactnativecommunity.imageeditor

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.turbomodule.core.interfaces.TurboModule

class ImageEditorPackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == ImageEditorModule.NAME) {
            ImageEditorModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        val moduleList: Array<Class<out NativeModule?>> = arrayOf(ImageEditorModule::class.java)
        val reactModuleInfoMap: MutableMap<String, ReactModuleInfo> = HashMap()
        for (moduleClass in moduleList) {
            val reactModule = moduleClass.getAnnotation(ReactModule::class.java) ?: continue
            reactModuleInfoMap[reactModule.name] =
                ReactModuleInfo(
                    reactModule.name,
                    moduleClass.name,
                    true,
                    reactModule.needsEagerInit,
                    reactModule.hasConstants,
                    reactModule.isCxxModule,
                    TurboModule::class.java.isAssignableFrom(moduleClass)
                )
        }
        return ReactModuleInfoProvider { reactModuleInfoMap }
    }
}
