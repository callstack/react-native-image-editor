/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Codegen writes the spec header to ReactCodegen/RNCImageEditorSpec/… and keeps
// that nesting under both CocoaPods (header_mappings_dir) and SPM (the
// ReactAppHeaders farm). The plain `#import "RNCImageEditorSpec.h"` used to sit
// here resolved only through CocoaPods' generated headermaps, which SPM has no
// equivalent of — SPM could not find the file at all.
#import <ReactCodegen/RNCImageEditorSpec/RNCImageEditorSpec.h>

@interface RNCImageEditor : NSObject <NativeRNCImageEditorSpec>

@end
