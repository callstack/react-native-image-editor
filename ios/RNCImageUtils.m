//
//  RNCImageUtils.m
//  RNCImageEditor
//
//  Created by Dawid Urbaniak on 30/05/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RNCImageUtils.h"

@implementation RNCImageUtils

+ (id)writeImage:(id)image toPath:(id)path
{
    [image writeToFile:path atomically:YES];
    NSURL *fileURL = [NSURL fileURLWithPath:path];
    return [fileURL absoluteString];
}

@end
