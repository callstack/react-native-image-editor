/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCImageEditor.h"

#import <UIKit/UIKit.h>

#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import <React/RCTImageLoader.h>
#import <React/RCTImageStoreManager.h>
#import "RNCFileSystem.h"
#import "RNCImageUtils.h"
#if __has_include(<RCTImage/RCTImageUtils.h>)
#import <RCTImage/RCTImageUtils.h>
#else
#import "RCTImageUtils.h"
#endif

@implementation RNCImageEditor

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

/**
 * Crops an image and saves the result to temporary file. Consider using
 * CameraRoll API or other third-party module to save it in gallery.
 *
 * @param imageRequest An image URL
 * @param cropData Dictionary with `offset`, `size` and `displaySize`.
 *        `offset` and `size` are relative to the full-resolution image size.
 *        `displaySize` is an optimization - if specified, the image will
 *        be scaled down to `displaySize` rather than `size`.
 *        All units are in px (not points).
 */
#ifdef RCT_NEW_ARCH_ENABLED
- (void) cropImage:(NSString *)uri
         cropData:(JS::NativeRNCImageEditor::SpecCropImageCropData &)data
         resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject
{
  CGSize size = [RCTConvert CGSize:@{ @"width": @(data.size().width()), @"height": @(data.size().height()) }];
  CGPoint offset = [RCTConvert CGPoint:@{ @"x": @(data.offset().x()), @"y": @(data.offset().y()) }];
  CGSize targetSize = size;
  if (data.displaySize().has_value()) {
    JS::NativeRNCImageEditor::SpecCropImageCropDataDisplaySize displaySize = *data.displaySize(); // Extract the value from the optional
    // in pixels
    targetSize = [RCTConvert CGSize:@{ @"width": @(displaySize.width()), @"height": @(displaySize.height()) }];
  }
  NSString *displaySize = data.resizeMode();
  NSURLRequest *imageRequest = [NSURLRequest requestWithURL:[NSURL URLWithString: uri]];
#else
RCT_EXPORT_METHOD(cropImage:(NSURLRequest *)imageRequest
                  cropData:(NSDictionary *)cropData
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  CGSize size = [RCTConvert CGSize:cropData[@"size"]];
  CGPoint offset = [RCTConvert CGPoint:cropData[@"offset"]];
  CGSize targetSize = size;
  NSString *displaySize = cropData[@"resizeMode"];
  if(displaySize){
    targetSize = [RCTConvert CGSize:cropData[@"displaySize"]];
  }
#endif
  CGRect rect = {offset,size};
  NSURL *url = [imageRequest URL];
  NSString *urlPath = [url path];
  NSString *extension = [urlPath pathExtension];

  [[_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES] loadImageWithURLRequest:imageRequest callback:^(NSError *error, UIImage *image) {
    if (error) {
      reject(@(error.code).stringValue, error.description, error);
      return;
    }

    // Crop image
    CGRect targetRect = {{-rect.origin.x, -rect.origin.y}, image.size};
    CGAffineTransform transform = RCTTransformFromTargetRect(image.size, targetRect);
    UIImage *croppedImage = RCTTransformImage(image, targetSize, image.scale, transform);

    // Scale image
    if (displaySize) {
      RCTResizeMode resizeMode = [RCTConvert RCTResizeMode:displaySize ?: @"contain"];
      targetRect = RCTTargetRect(croppedImage.size, targetSize, 1, resizeMode);
      transform = RCTTransformFromTargetRect(croppedImage.size, targetRect);
      croppedImage = RCTTransformImage(croppedImage, targetSize, image.scale, transform);
    }

    // Store image
    NSString *path = NULL;
    NSData *imageData = NULL;

    if([extension isEqualToString:@"png"]){
      imageData = UIImagePNGRepresentation(croppedImage);
      path = [RNCFileSystem generatePathInDirectory:[[RNCFileSystem cacheDirectoryPath] stringByAppendingPathComponent:@"ReactNative_cropped_image_"] withExtension:@".png"];
    }
    else{

      imageData = UIImageJPEGRepresentation(croppedImage, 1);
      path = [RNCFileSystem generatePathInDirectory:[[RNCFileSystem cacheDirectoryPath] stringByAppendingPathComponent:@"ReactNative_cropped_image_"] withExtension:@".jpg"];
    }

    NSError *writeError;
    NSString *uri = [RNCImageUtils writeImage:imageData toPath:path error:&writeError];

    if (writeError != nil) {
      reject(@(writeError.code).stringValue, writeError.description, writeError);
      return;
    }

    resolve(uri);
  }];
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeRNCImageEditorSpecJSI>(params);
}
#endif

@end
