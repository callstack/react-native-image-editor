package com.reactnativecommunity.imageeditor;

import java.util.Collections;
import java.util.Map;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = ImageEditorModule.NAME)
public class ImageEditorModule extends ReactContextBaseJavaModule {
  private ImageEditorModuleImpl moduleImpl;

  public ImageEditorModule(ReactApplicationContext reactContext) {
    super(reactContext);
    moduleImpl = new ImageEditorModuleImpl(reactContext);
  }

  public static final String NAME = ImageEditorModuleImpl.NAME;

  @Override
  public String getName() {
    return ImageEditorModuleImpl.NAME;
  }


  @Override
  public Map<String, Object> getConstants() {
    return Collections.emptyMap();
  }

  @Override
  public void onCatalystInstanceDestroy() {
    moduleImpl.onCatalystInstanceDestroy();
  }

  @ReactMethod
  public void cropImage(String uri, ReadableMap options, Promise promise) {
    moduleImpl.cropImage(uri, options, promise);
  }
}
