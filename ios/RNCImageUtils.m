//
//  RNCImageUtils.m
//  RNCImageEditor
//
//  Created by Dawid Urbaniak on 30/05/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RNCImageUtils.h"

@implementation RNCImageUtils

+ (id)writeImage:(id)image toPath:(id)path error:(NSError **)error
{
    BOOL res = [image writeToFile:path atomically:YES];
    if (res == NO) {
        *error = [NSError errorWithDomain:@"org.reactnativecommunity.imageeditor.writeToFileError" code:101 userInfo:[NSDictionary dictionary]];
        return nil;
    }
    NSURL *fileURL = [NSURL fileURLWithPath:path];
    return [fileURL absoluteString];
}

@end
