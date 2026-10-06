/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.reactnativecommunity.imageeditor

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class ImageEditorPackage : BaseReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == ImageEditorModule.NAME) {
            ImageEditorModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                ImageEditorModule.NAME to
                    ReactModuleInfo(
                        ImageEditorModule.NAME, // name
                        ImageEditorModule::class.java.name, // className
                        true, // canOverrideExistingModule
                        false, // needsEagerInit
                        false, // isCxxModule
                        true, // isTurboModule
                    )
            )
        }
    }
}
