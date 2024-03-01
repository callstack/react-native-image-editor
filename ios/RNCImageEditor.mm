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

#define DEFAULT_DISPLAY_SIZE 0
#define DEFAULT_COMPRESSION_QUALITY 0.9
#define DEFAULT_RESIZE_MODE "cover"

struct Params {
public:
    CGPoint offset;
    CGSize size;
    CGSize displaySize;
    RCTResizeMode resizeMode;
    CGFloat quality;
    NSString *format;
    BOOL includeBase64;
    NSDictionary *headers;
};

@implementation RNCImageEditor

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (Params)adaptParamsWithFormat:(id)format
                          width:(id)width
                         height:(id)height
                        offsetX:(id)offsetX
                        offsetY:(id)offsetY
                     resizeMode:(id)resizeMode
                   displayWidth:(id)displayWidth
                  displayHeight:(id)displayHeight
                        quality:(id)quality
                  includeBase64:(id)includeBase64
                        headers:(id)headers
{
    return Params{
        .offset = {[RCTConvert double:offsetX], [RCTConvert double:offsetY]},
        .size = {[RCTConvert double:width], [RCTConvert double:height]},
        .displaySize = {[RCTConvert double:displayWidth], [RCTConvert double:displayHeight]},
        .resizeMode = [RCTConvert RCTResizeMode:resizeMode ?: @(DEFAULT_RESIZE_MODE)],
        .quality = [RCTConvert CGFloat:quality],
        .format = [RCTConvert NSString:format],
        .includeBase64 = [RCTConvert BOOL:includeBase64],
        .headers = [RCTConvert NSDictionary:RCTNilIfNull(headers)]
    };
}

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
    auto params = [self adaptParamsWithFormat:data.format()
        width:@(data.size().width())
        height:@(data.size().height())
        offsetX:@(data.offset().x())
        offsetY:@(data.offset().y())
        resizeMode:data.resizeMode()
        displayWidth:@(data.displaySize().has_value() ? data.displaySize()->width() : DEFAULT_DISPLAY_SIZE)
        displayHeight:@(data.displaySize().has_value() ? data.displaySize()->height() : DEFAULT_DISPLAY_SIZE)
        quality:@(data.quality().has_value() ? *data.quality() : DEFAULT_COMPRESSION_QUALITY)
        includeBase64:@(data.includeBase64().has_value() ? *data.includeBase64() : NO)
        headers: data.headers()];
#else
RCT_EXPORT_METHOD(cropImage:(NSString *)uri
                  cropData:(NSDictionary *)cropData
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  auto params = [self adaptParamsWithFormat:cropData[@"format"]
    width:cropData[@"size"][@"width"]
    height:cropData[@"size"][@"height"]
    offsetX:cropData[@"offset"][@"x"]
    offsetY:cropData[@"offset"][@"y"]
    resizeMode:cropData[@"resizeMode"]
    displayWidth:cropData[@"displaySize"] ? cropData[@"displaySize"][@"width"] : @(DEFAULT_DISPLAY_SIZE)
    displayHeight:cropData[@"displaySize"] ? cropData[@"displaySize"][@"height"] : @(DEFAULT_DISPLAY_SIZE)
    quality:cropData[@"quality"] ? cropData[@"quality"] : @(DEFAULT_COMPRESSION_QUALITY)
    includeBase64:cropData[@"includeBase64"]
    headers:cropData[@"headers"]];

#endif
  NSMutableURLRequest *imageRequest = [NSMutableURLRequest requestWithURL:[NSURL URLWithString: uri]];
  [params.headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
    if (value) {
      [imageRequest addValue:[RCTConvert NSString:value] forHTTPHeaderField:key];
    }
  }];

  NSURL *url = [imageRequest URL];
  NSString *urlPath = [url path];
  NSString *extension = [urlPath pathExtension];
  if([params.format isEqualToString:@"png"] || [params.format isEqualToString:@"jpeg"]){
    extension = params.format;
  }

  [[_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES] loadImageWithURLRequest:imageRequest callback:^(NSError *error, UIImage *image) {
    if (error) {
      reject(@(error.code).stringValue, error.description, error);
      return;
    }
    if (params.quality > 1 || params.quality < 0) {
      reject(RCTErrorUnspecified, @("quality must be a number between 0 and 1"), nil);
      return;
    }

    // Crop image
    CGSize targetSize = params.size;
    CGRect targetRect = {{-params.offset.x, -params.offset.y}, image.size};
    CGAffineTransform transform = RCTTransformFromTargetRect(image.size, targetRect);
    UIImage *croppedImage = RCTTransformImage(image, targetSize, image.scale, transform);

    // Scale image
    if (params.displaySize.width != DEFAULT_DISPLAY_SIZE && params.displaySize.height != DEFAULT_DISPLAY_SIZE) {
      targetSize = params.displaySize;
      targetRect = RCTTargetRect(croppedImage.size, targetSize, 1, params.resizeMode);
      transform = RCTTransformFromTargetRect(croppedImage.size, targetRect);
      croppedImage = RCTTransformImage(croppedImage, targetSize, image.scale, transform);
    }

    // Store image
    NSString *type = @"image/jpeg";
    NSString *path = NULL;
    NSData *imageData = NULL;

    if([extension isEqualToString:@"png"]){
      type = @"image/png";
      imageData = UIImagePNGRepresentation(croppedImage);
      path = [RNCFileSystem generatePathInDirectory:[[RNCFileSystem cacheDirectoryPath] stringByAppendingPathComponent:@"ReactNative_cropped_image_"] withExtension:@".png"];
    } else{
      imageData = UIImageJPEGRepresentation(croppedImage, params.quality);
      path = [RNCFileSystem generatePathInDirectory:[[RNCFileSystem cacheDirectoryPath] stringByAppendingPathComponent:@"ReactNative_cropped_image_"] withExtension:@".jpg"];
    }

    NSError *writeError;
    NSString *uri = [RNCImageUtils writeImage:imageData toPath:path error:&writeError];

    if (writeError != nil) {
      reject(@(writeError.code).stringValue, writeError.description, writeError);
      return;
    }

    NSURL *fileurl = [[NSURL alloc] initFileURLWithPath:path];
    NSString *filename = fileurl.lastPathComponent;
    NSError *attributesError = nil;
    NSDictionary *fileAttributes = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:&attributesError];
    NSNumber *fileSize = fileAttributes == nil ? 0 : [fileAttributes objectForKey:NSFileSize];

    NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
    response[@"path"] = path;
    response[@"uri"] = uri;
    response[@"name"] = filename;
    response[@"type"] = type;
    response[@"size"] = fileSize ?: @(0);
    response[@"width"] = @(croppedImage.size.width);
    response[@"height"] = @(croppedImage.size.height);
    if (params.includeBase64) {
      response[@"base64"] = [imageData base64EncodedStringWithOptions:0];
    }

    resolve(response);
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
