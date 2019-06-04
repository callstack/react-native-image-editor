//
//  RNFileSystem.h
//  RNCImageEditor
//
//  Created by Dawid Urbaniak on 30/05/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#ifndef RNCFileSystem_h
#define RNCFileSystem_h

#import <Foundation/Foundation.h>

@interface RNCFileSystem : NSObject

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;
+ (NSString *)cacheDirectoryPath;

@end

#endif /* RNCFileSystem_h */
