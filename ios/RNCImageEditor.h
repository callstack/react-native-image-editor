/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNCImageEditorSpec.h"

@interface RNCImageEditor : NSObject <NativeRNCImageEditorSpec>
#else
#import <React/RCTBridgeModule.h>

@interface RNCImageEditor : NSObject <RCTBridgeModule>
#endif

@end
