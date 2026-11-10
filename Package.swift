// swift-tools-version: 6.0
/**
 * Swift Package Manager support.
 *
 * This is a hand-maintained ("self-managed") manifest: React Native's SPM
 * autolinker sees a checked-in Package.swift and uses it as-is instead of
 * generating a wrapper around this package — see `findSelfManagedPackageDir`
 * in react-native/scripts/spm/generate-spm-autolinking.js. CocoaPods keeps
 * using react-native-image-editor.podspec, so apps on RN < 0.87 are unaffected.
 *
 * Two contracts the autolinker imposes, both easy to break silently:
 *
 * 1. The package, its single library product and the target must all be named
 *    `ImageEditor`. The `swiftpmConfig.name` in package.json pins this name so
 *    CocoaPods' dashed pod name does not become the SPM product name. The
 *    aggregator references us as
 *    `.product(name: "ImageEditor", package: "ImageEditor")`, so renaming any
 *    of the three fails resolution with "no product named ... available".
 *
 * 2. The `.package(path:)` references below are constant relative strings, not
 *    paths to discover at manifest-evaluation time. The autolinker routes this
 *    package through a symlink at
 *    `<appRoot>/build/generated/autolinking/libs/ImageEditor`, and SwiftPM
 *    resolves a manifest's relative package paths against that symlink without
 *    canonicalizing it, so both packages sit at a fixed depth in every app:
 *      build/xcframeworks   -> ../../../../xcframeworks
 *      build/generated/ios  -> ../../../ios
 *    That is exactly what react-native/scripts/spm/scaffold-package-swift.js
 *    emits. Do not replace them with `#filePath` walks or absolute paths.
 *
 * React headers need no search paths here — they arrive through the products
 * listed on the target. `RCTImage` is not a separate product: the React
 * xcframework vends RCTImageLoader / RCTImageUtils / RCTConvert flat under the
 * `React` module and umbrella, and exports RCTTransformImage et al.
 */

import PackageDescription

let package = Package(
    name: "ImageEditor",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "ImageEditor", targets: ["ImageEditor"]),
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ],
    targets: [
        .target(
            name: "ImageEditor",
            dependencies: [
                .product(name: "ReactHeaders", package: "ReactNative"),
                .product(name: "ReactNativeHeaders", package: "ReactNative"),
                .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
                .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
            ],
            // Scoped to `ios` so SPM discovers sources itself — a new native
            // file needs no manifest edit. `publicHeadersPath: "."` keeps the
            // same include surface as CocoaPods (`#import "RNCFileSystem.h"`),
            // and keeps SPM's artifacts (.build/, .swiftpm/) out of the source
            // dir's way.
            path: "ios",
            publicHeadersPath: ".",
            cxxSettings: [
                // DEBUG/NDEBUG must match the prebuilt React.framework's
                // config-gated C++ ABI: NDEBUG strips DebugStringConvertible's
                // vtable and shifts the ShadowNode layout codegen'd types
                // inherit, so a mismatched Release link fails on undefined
                // symbols. Mirrors React Native's own SPM manifests.
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release)),
            ],
            linkerSettings: [
                .linkedFramework("UIKit"),
                .linkedFramework("Foundation"),
                .linkedFramework("CoreGraphics"),
            ]
        ),
    ],
    // Required by the React headers (concepts, std::optional) and by the
    // codegen'd spec this module imports.
    cxxLanguageStandard: .cxx20
)
