/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// SPM exposes generated specs through ReactAppHeaders. CocoaPods usually
// exposes the same nested path, but older Pods setups may only resolve the
// header through CocoaPods' generated headermaps.
#if __has_include(<ReactCodegen/RNCImageEditorSpec/RNCImageEditorSpec.h>)
#import <ReactCodegen/RNCImageEditorSpec/RNCImageEditorSpec.h>
#else
#import "RNCImageEditorSpec.h"
#endif

@interface RNCImageEditor : NSObject <NativeRNCImageEditorSpec>

@end
