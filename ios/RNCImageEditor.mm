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

#define DEFAULT_COMPRESSION_QUALITY 0.9

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
  NSString *format = data.format();
  CGSize size = [RCTConvert CGSize:@{ @"width": @(data.size().width()), @"height": @(data.size().height()) }];
  CGPoint offset = [RCTConvert CGPoint:@{ @"x": @(data.offset().x()), @"y": @(data.offset().y()) }];
  CGSize targetSize = size;
  CGSize displaySize = CGSizeZero;
  BOOL hasDisplaySizeValue = data.displaySize().has_value();
  if (hasDisplaySizeValue) {
    JS::NativeRNCImageEditor::SpecCropImageCropDataDisplaySize rawDisplaySize = *data.displaySize(); // Extract the value from the optional
    // in pixels
    displaySize = [RCTConvert CGSize:@{ @"width": @(rawDisplaySize.width()), @"height": @(rawDisplaySize.height()) }];
  }
  RCTResizeMode resizeMode = [RCTConvert RCTResizeMode:data.resizeMode() ?: @"contain"];
  NSURLRequest *imageRequest = [NSURLRequest requestWithURL:[NSURL URLWithString: uri]];
  CGFloat compressionQuality = DEFAULT_COMPRESSION_QUALITY;
  if (data.quality().has_value()) {
    compressionQuality = *data.quality();
  }
#else
RCT_EXPORT_METHOD(cropImage:(NSURLRequest *)imageRequest
                  cropData:(NSDictionary *)cropData
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  NSString *format = cropData[@"format"];
  CGSize size = [RCTConvert CGSize:cropData[@"size"]];
  CGPoint offset = [RCTConvert CGPoint:cropData[@"offset"]];
  RCTResizeMode resizeMode = [RCTConvert RCTResizeMode:cropData[@"resizeMode"] ?: @"contain"];
  CGSize displaySize = CGSizeZero;
  BOOL hasDisplaySizeValue = cropData[@"displaySize"];
  if(hasDisplaySizeValue){
      displaySize = [RCTConvert CGSize:cropData[@"displaySize"]];
  }
  CGFloat compressionQuality = DEFAULT_COMPRESSION_QUALITY;
  if(cropData[@"quality"]){
      compressionQuality = [RCTConvert CGFloat:cropData[@"quality"]];
  }
#endif
  CGRect rect = {offset,size};
  NSURL *url = [imageRequest URL];
  NSString *urlPath = [url path];
  NSString *extension = [urlPath pathExtension];
  if([format isEqualToString:@"png"] || [format isEqualToString:@"jpeg"]){
    extension = format;
  }

  [[_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES] loadImageWithURLRequest:imageRequest callback:^(NSError *error, UIImage *image) {
    if (error) {
      reject(@(error.code).stringValue, error.description, error);
      return;
    }
    if (compressionQuality > 1 || compressionQuality < 0) {
      reject(RCTErrorUnspecified, @("quality must be a number between 0 and 1"), nil);
      return;
    }

    // Crop image
    CGSize targetSize = rect.size;
    CGRect targetRect = {{-rect.origin.x, -rect.origin.y}, image.size};
    CGAffineTransform transform = RCTTransformFromTargetRect(image.size, targetRect);
    UIImage *croppedImage = RCTTransformImage(image, targetSize, image.scale, transform);

    // Scale image
    if (hasDisplaySizeValue) {
      targetSize = displaySize;
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

      imageData = UIImageJPEGRepresentation(croppedImage, compressionQuality);
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
