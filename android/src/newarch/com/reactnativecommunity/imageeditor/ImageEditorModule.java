package com.reactnativecommunity.imageeditor;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = ImageEditorModule.NAME)
public class ImageEditorModule extends NativeRNCImageEditorSpec {
  private ImageEditorModuleImpl moduleImpl;

  ImageEditorModule(ReactApplicationContext context) {
    super(context);
    moduleImpl = new ImageEditorModuleImpl(context);
  }

  public static final String NAME = ImageEditorModuleImpl.NAME;

  @Override
  @NonNull
  public String getName() {
    return ImageEditorModuleImpl.NAME;
  }

  @Override
  public void onCatalystInstanceDestroy() {
    moduleImpl.onCatalystInstanceDestroy();
  }

  @Override
  public void cropImage(String uri, ReadableMap cropData, Promise promise) {
    moduleImpl.cropImage(uri, cropData, promise);
  }
}
