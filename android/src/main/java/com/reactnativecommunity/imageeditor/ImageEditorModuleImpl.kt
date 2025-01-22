/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.reactnativecommunity.imageeditor

import android.annotation.SuppressLint
import android.content.ContentResolver
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Bitmap.CompressFormat
import android.graphics.BitmapFactory
import android.graphics.BitmapRegionDecoder
import android.graphics.Matrix
import android.graphics.Rect
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.text.TextUtils
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.ReactConstants
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.net.URL
import kotlin.math.roundToInt
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

object MimeType {
    const val JPEG = "image/jpeg"
    const val PNG = "image/png"
    const val WEBP = "image/webp"
}

class ImageEditorModuleImpl(private val reactContext: ReactApplicationContext) {
    private val moduleCoroutineScope = CoroutineScope(Dispatchers.Default)

    init {
        cleanTask()
    }

    fun invalidate() {
        if (moduleCoroutineScope.isActive) {
            moduleCoroutineScope.cancel()
        }
        cleanTask()
    }

    /**
     * Asynchronous task that cleans up cache dirs (internal and, if available, external) of cropped
     * image files. This is run when the module is invalidated (i.e. app is shutting down) and when
     * the module is instantiated, to handle the case where the app crashed.
     */
    private fun cleanTask() {
        moduleCoroutineScope.launch {
            cleanDirectory(reactContext.cacheDir)
            val externalCacheDir = reactContext.externalCacheDir
            externalCacheDir?.let { cleanDirectory(it) }
        }
    }

    private fun cleanDirectory(directory: File) {
        val toDelete = directory.listFiles { _, filename -> filename.startsWith(TEMP_FILE_PREFIX) }
        if (toDelete != null) {
            for (file in toDelete) {
                file.delete()
            }
        }
    }

    /**
     * React Native
     * - 0.77.x: toHashMap(): HashMap<String, Any?>?
     * - 0.76.x: toHashMap(): HashMap<String, Any>?
     */
    fun <V> safeConvert(map: HashMap<String, V>?): HashMap<String, Any>? {
        return map?.filterValues { it != null } as? HashMap<String, Any>
    }

    /**
     * Crop an image. If all goes well, the promise will be resolved with the file:// URI of the new
     * image as the only argument. This is a temporary file - consider using
     * CameraRollManager.saveImageWithTag to save it in the gallery.
     *
     * @param uri the URI of the image to crop
     * @param options crop parameters specified as `{offset: {x, y}, size: {width, height}}`.
     *   Optionally this also contains `{targetSize: {width, height}}`. If this is specified, the
     *   cropped image will be resized to that size. All units are in pixels (not DPs).
     * @param promise Promise to be resolved when the image has been cropped; the only argument that
     *   is passed to this is the file:// URI of the new image
     */
    fun cropImage(uri: String?, options: ReadableMap, promise: Promise) {
        val headers =
            if (options.hasKey("headers") && options.getType("headers") == ReadableType.Map)
                safeConvert(options.getMap("headers")?.toHashMap())
            else null
        val format = if (options.hasKey("format")) options.getString("format") else null
        val offset = if (options.hasKey("offset")) options.getMap("offset") else null
        val size = if (options.hasKey("size")) options.getMap("size") else null
        val includeBase64 =
            if (options.hasKey("includeBase64")) options.getBoolean("includeBase64") else false
        val quality =
            if (options.hasKey("quality")) (options.getDouble("quality") * 100).toInt() else 90
        if (
            offset == null ||
                size == null ||
                !offset.hasKey("x") ||
                !offset.hasKey("y") ||
                !size.hasKey("width") ||
                !size.hasKey("height")
        ) {
            throw JSApplicationIllegalArgumentException("Please specify offset and size")
        }
        if (uri.isNullOrEmpty()) {
            throw JSApplicationIllegalArgumentException("Please specify a URI")
        }
        if (quality > 100 || quality < 0) {
            promise.reject(
                JSApplicationIllegalArgumentException("quality must be a number between 0 and 1")
            )
            return
        }
        val x = offset.getDouble("x").toInt()
        val y = offset.getDouble("y").toInt()
        val width = size.getDouble("width").toInt()
        val height = size.getDouble("height").toInt()
        val (targetWidth, targetHeight) =
            if (options.hasKey("displaySize")) {
                val targetSize = options.getMap("displaySize")!!
                Pair(targetSize.getDouble("width").toInt(), targetSize.getDouble("height").toInt())
            } else Pair(0, 0)

        moduleCoroutineScope.launch {
            try {
                val outOptions = BitmapFactory.Options()

                // If we're downscaling, we can decode the bitmap more efficiently, using less
                // memory
                val hasTargetSize = targetWidth > 0 && targetHeight > 0
                val cropped: Bitmap? =
                    if (hasTargetSize) {
                        cropAndResizeTask(
                            outOptions,
                            uri,
                            x,
                            y,
                            width,
                            height,
                            targetWidth,
                            targetHeight,
                            headers
                        )
                    } else {
                        cropTask(outOptions, uri, x, y, width, height, headers)
                    }
                if (cropped == null) {
                    throw IOException("Cannot decode bitmap: $uri")
                }
                val mimeType = getMimeType(outOptions, format)
                val tempFile = createTempFile(reactContext, mimeType)
                writeCompressedBitmapToFile(cropped, mimeType, tempFile, quality)
                if (mimeType == MimeType.JPEG) {
                    copyExif(reactContext, Uri.parse(uri), tempFile)
                }
                promise.resolve(getResultMap(tempFile, cropped, mimeType, includeBase64))
            } catch (e: Exception) {
                promise.reject(e)
            }
        }
    }

    /**
     * Reads and crops the bitmap.
     *
     * @param outOptions Bitmap options, useful to determine `outMimeType`.
     * @param uri the URI of the image to crop
     * @param x left coordinate of the cropped image
     * @param y top coordinate of the cropped image
     * @param width width of the cropped image
     * @param height height of the cropped image
     */
    private fun cropTask(
        outOptions: BitmapFactory.Options,
        uri: String,
        x: Int,
        y: Int,
        width: Int,
        height: Int,
        headers: HashMap<String, Any>?
    ): Bitmap? {
        return openBitmapInputStream(uri, headers)?.use {
            // Efficiently crops image without loading full resolution into memory
            // https://developer.android.com/reference/android/graphics/BitmapRegionDecoder.html
            val decoder =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    BitmapRegionDecoder.newInstance(it)
                } else {
                    @Suppress("DEPRECATION") BitmapRegionDecoder.newInstance(it, false)
                } ?: throw Error("Could not create bitmap decoder. Uri: $uri")

            val imageHeight: Int = decoder.height
            val imageWidth: Int = decoder.width
            val orientation = getOrientation(reactContext, Uri.parse(uri))

            val (left, top) =
                when (orientation) {
                    90 -> y to imageHeight - width - x
                    180 -> imageWidth - width - x to imageHeight - height - y
                    270 -> imageWidth - height - y to x
                    else -> x to y
                }

            val (right, bottom) =
                when (orientation) {
                    90,
                    270 -> left + height to top + width
                    else -> left + width to top + height
                }

            return@use try {
                val rect = Rect(left, top, right, bottom)
                decoder.decodeRegion(rect, outOptions)
            } finally {
                decoder.recycle()
            }
        }
    }

    /**
     * Crop the rectangle given by `mX, mY, mWidth, mHeight` within the source bitmap and scale the
     * result to `targetWidth, targetHeight`.
     *
     * @param outOptions Bitmap options, useful to determine `outMimeType`.
     * @param uri the URI of the image to crop
     * @param x left coordinate of the cropped image
     * @param y top coordinate of the cropped image
     * @param width width of the cropped image
     * @param height height of the cropped image
     * @param targetWidth width of the resized image
     * @param targetHeight height of the resized image
     */
    private fun cropAndResizeTask(
        outOptions: BitmapFactory.Options,
        uri: String,
        xPos: Int,
        yPos: Int,
        rectWidth: Int,
        rectHeight: Int,
        outputWidth: Int,
        outputHeight: Int,
        headers: HashMap<String, Any>?
    ): Bitmap? {
        Assertions.assertNotNull(outOptions)

        return openBitmapInputStream(uri, headers)?.use {
            // Efficiently crops image without loading full resolution into memory
            // https://developer.android.com/reference/android/graphics/BitmapRegionDecoder.html
            val decoder =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    BitmapRegionDecoder.newInstance(it)
                } else {
                    @Suppress("DEPRECATION") BitmapRegionDecoder.newInstance(it, false)
                } ?: throw Error("Could not create bitmap decoder. Uri: $uri")

            val orientation = getOrientation(reactContext, Uri.parse(uri))
            val (x, y) =
                when (orientation) {
                    90 -> yPos to decoder.height - rectWidth - xPos
                    270 -> decoder.width - rectHeight - yPos to xPos
                    180 -> decoder.width - rectWidth - xPos to decoder.height - rectHeight - yPos
                    else -> xPos to yPos
                }

            val (width, height) =
                when (orientation) {
                    90,
                    270 -> rectHeight to rectWidth
                    else -> rectWidth to rectHeight
                }
            val (targetWidth, targetHeight) =
                when (orientation) {
                    90,
                    270 -> outputHeight to outputWidth
                    else -> outputWidth to outputHeight
                }

            val cropRectRatio = width / height.toFloat()
            val targetRatio = targetWidth / targetHeight.toFloat()
            val isCropRatioLargerThanTargetRatio = cropRectRatio > targetRatio
            val newWidth =
                if (isCropRatioLargerThanTargetRatio) height * targetRatio else width.toFloat()
            val newHeight =
                if (isCropRatioLargerThanTargetRatio) height.toFloat() else width / targetRatio
            val newX =
                if (isCropRatioLargerThanTargetRatio) x + (width - newWidth) / 2 else x.toFloat()
            val newY =
                if (isCropRatioLargerThanTargetRatio) y.toFloat() else y + (height - newHeight) / 2
            val scale =
                if (isCropRatioLargerThanTargetRatio) targetHeight / height.toFloat()
                else targetWidth / width.toFloat()

            // Decode the bitmap. We have to open the stream again, like in the example linked
            // above.
            // Is there a way to just continue reading from the stream?
            outOptions.inSampleSize = getDecodeSampleSize(width, height, targetWidth, targetHeight)

            val cropX = (newX / outOptions.inSampleSize.toFloat()).roundToInt()
            val cropY = (newY / outOptions.inSampleSize.toFloat()).roundToInt()
            val cropWidth = (newWidth / outOptions.inSampleSize.toFloat()).roundToInt()
            val cropHeight = (newHeight / outOptions.inSampleSize.toFloat()).roundToInt()
            val cropScale = scale * outOptions.inSampleSize
            val scaleMatrix = Matrix().apply { setScale(cropScale, cropScale) }
            val filter = true

            val rect = Rect(0, 0, decoder.width, decoder.height)
            val bitmap = decoder.decodeRegion(rect, outOptions)

            return Bitmap.createBitmap(
                bitmap,
                cropX,
                cropY,
                cropWidth,
                cropHeight,
                scaleMatrix,
                filter
            )
        }
    }

    private fun openBitmapInputStream(uri: String, headers: HashMap<String, Any>?): InputStream? {
        return if (uri.startsWith("data:")) {
            val src = uri.substring(uri.indexOf(",") + 1)
            ByteArrayInputStream(Base64.decode(src, Base64.DEFAULT))
        } else if (isLocalUri(uri)) {
            reactContext.contentResolver.openInputStream(Uri.parse(uri))
        } else {
            val connection = URL(uri).openConnection()
            headers?.forEach { (key, value) ->
                if (value is String) {
                    connection.setRequestProperty(key, value)
                }
            }
            connection.getInputStream()
        }
    }

    companion object {
        const val NAME = "RNCImageEditor"
        private val LOCAL_URI_PREFIXES =
            listOf(
                ContentResolver.SCHEME_FILE,
                ContentResolver.SCHEME_CONTENT,
                ContentResolver.SCHEME_ANDROID_RESOURCE
            )
        private const val TEMP_FILE_PREFIX = "ReactNative_cropped_image_"

        @SuppressLint("InlinedApi")
        private val EXIF_ATTRIBUTES =
            arrayOf(
                ExifInterface.TAG_APERTURE_VALUE,
                ExifInterface.TAG_MAX_APERTURE_VALUE,
                ExifInterface.TAG_METERING_MODE,
                ExifInterface.TAG_ARTIST,
                ExifInterface.TAG_BITS_PER_SAMPLE,
                ExifInterface.TAG_COMPRESSION,
                ExifInterface.TAG_BODY_SERIAL_NUMBER,
                ExifInterface.TAG_BRIGHTNESS_VALUE,
                ExifInterface.TAG_CONTRAST,
                ExifInterface.TAG_CAMERA_OWNER_NAME,
                ExifInterface.TAG_COLOR_SPACE,
                ExifInterface.TAG_COPYRIGHT,
                ExifInterface.TAG_DATETIME,
                ExifInterface.TAG_DATETIME_DIGITIZED,
                ExifInterface.TAG_DATETIME_ORIGINAL,
                ExifInterface.TAG_DEVICE_SETTING_DESCRIPTION,
                ExifInterface.TAG_DIGITAL_ZOOM_RATIO,
                ExifInterface.TAG_EXIF_VERSION,
                ExifInterface.TAG_EXPOSURE_BIAS_VALUE,
                ExifInterface.TAG_EXPOSURE_INDEX,
                ExifInterface.TAG_EXPOSURE_MODE,
                ExifInterface.TAG_EXPOSURE_TIME,
                ExifInterface.TAG_EXPOSURE_PROGRAM,
                ExifInterface.TAG_FLASH,
                ExifInterface.TAG_FLASH_ENERGY,
                ExifInterface.TAG_FOCAL_LENGTH,
                ExifInterface.TAG_FOCAL_LENGTH_IN_35MM_FILM,
                ExifInterface.TAG_FOCAL_PLANE_RESOLUTION_UNIT,
                ExifInterface.TAG_FOCAL_PLANE_X_RESOLUTION,
                ExifInterface.TAG_FOCAL_PLANE_Y_RESOLUTION,
                ExifInterface.TAG_PHOTOMETRIC_INTERPRETATION,
                ExifInterface.TAG_PLANAR_CONFIGURATION,
                ExifInterface.TAG_F_NUMBER,
                ExifInterface.TAG_GAIN_CONTROL,
                ExifInterface.TAG_GAMMA,
                ExifInterface.TAG_GPS_ALTITUDE,
                ExifInterface.TAG_GPS_ALTITUDE_REF,
                ExifInterface.TAG_GPS_AREA_INFORMATION,
                ExifInterface.TAG_GPS_DATESTAMP,
                ExifInterface.TAG_GPS_DOP,
                ExifInterface.TAG_GPS_LATITUDE,
                ExifInterface.TAG_GPS_LATITUDE_REF,
                ExifInterface.TAG_GPS_LONGITUDE,
                ExifInterface.TAG_GPS_LONGITUDE_REF,
                ExifInterface.TAG_GPS_STATUS,
                ExifInterface.TAG_GPS_DEST_BEARING,
                ExifInterface.TAG_GPS_DEST_BEARING_REF,
                ExifInterface.TAG_GPS_DEST_DISTANCE,
                ExifInterface.TAG_GPS_DEST_DISTANCE_REF,
                ExifInterface.TAG_GPS_DEST_LATITUDE,
                ExifInterface.TAG_GPS_DEST_LATITUDE_REF,
                ExifInterface.TAG_GPS_DEST_LONGITUDE,
                ExifInterface.TAG_GPS_DEST_LONGITUDE_REF,
                ExifInterface.TAG_GPS_DIFFERENTIAL,
                ExifInterface.TAG_GPS_IMG_DIRECTION,
                ExifInterface.TAG_GPS_IMG_DIRECTION_REF,
                ExifInterface.TAG_GPS_MAP_DATUM,
                ExifInterface.TAG_GPS_MEASURE_MODE,
                ExifInterface.TAG_GPS_PROCESSING_METHOD,
                ExifInterface.TAG_GPS_SATELLITES,
                ExifInterface.TAG_GPS_SPEED,
                ExifInterface.TAG_GPS_SPEED_REF,
                ExifInterface.TAG_GPS_STATUS,
                ExifInterface.TAG_GPS_TIMESTAMP,
                ExifInterface.TAG_GPS_TRACK,
                ExifInterface.TAG_GPS_TRACK_REF,
                ExifInterface.TAG_GPS_VERSION_ID,
                ExifInterface.TAG_IMAGE_DESCRIPTION,
                ExifInterface.TAG_IMAGE_UNIQUE_ID,
                ExifInterface.TAG_ISO_SPEED,
                ExifInterface.TAG_PHOTOGRAPHIC_SENSITIVITY,
                ExifInterface.TAG_JPEG_INTERCHANGE_FORMAT,
                ExifInterface.TAG_JPEG_INTERCHANGE_FORMAT_LENGTH,
                ExifInterface.TAG_LENS_MAKE,
                ExifInterface.TAG_LENS_MODEL,
                ExifInterface.TAG_LENS_SERIAL_NUMBER,
                ExifInterface.TAG_LENS_SPECIFICATION,
                ExifInterface.TAG_LIGHT_SOURCE,
                ExifInterface.TAG_MAKE,
                ExifInterface.TAG_MAKER_NOTE,
                ExifInterface.TAG_MODEL,
                ExifInterface.TAG_ORIENTATION,
                ExifInterface.TAG_SATURATION,
                ExifInterface.TAG_SHARPNESS,
                ExifInterface.TAG_SHUTTER_SPEED_VALUE,
                ExifInterface.TAG_SOFTWARE,
                ExifInterface.TAG_SUBJECT_DISTANCE,
                ExifInterface.TAG_SUBJECT_DISTANCE_RANGE,
                ExifInterface.TAG_SUBJECT_LOCATION,
                ExifInterface.TAG_USER_COMMENT,
                ExifInterface.TAG_WHITE_BALANCE
            )

        // Utils
        private fun getResultMap(
            resizedImage: File,
            image: Bitmap,
            mimeType: String,
            includeBase64: Boolean
        ): WritableMap {
            val response = Arguments.createMap()
            response.putString("path", resizedImage.absolutePath)
            response.putString("uri", Uri.fromFile(resizedImage).toString())
            response.putString("name", resizedImage.name)
            response.putInt("size", resizedImage.length().toInt())
            response.putInt("width", image.width)
            response.putInt("height", image.height)
            response.putString("type", mimeType)

            if (includeBase64) {
                response.putString("base64", getBase64String(resizedImage))
            }

            return response
        }

        private fun getBase64String(file: File): String {
            val inputStream = FileInputStream(file)
            val buffer = ByteArray(file.length().toInt())
            inputStream.read(buffer)
            inputStream.close()
            return Base64.encodeToString(buffer, Base64.NO_WRAP)
        }

        private fun getMimeType(outOptions: BitmapFactory.Options, format: String?): String {
            val mimeType =
                when (format) {
                    "webp" -> MimeType.WEBP
                    "png" -> MimeType.PNG
                    "jpeg" -> MimeType.JPEG
                    else -> outOptions.outMimeType
                }
            if (mimeType.isNullOrEmpty()) {
                return MimeType.JPEG
            }
            return mimeType
        }

        private fun getOrientation(context: Context, uri: Uri): Int {
            val file = getFileFromUri(context, uri)
            if (file == null) {
                return 0
            }
            val exif = ExifInterface(file.absolutePath)
            return when (
                exif.getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL
                )
            ) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90
                ExifInterface.ORIENTATION_ROTATE_180 -> 180
                ExifInterface.ORIENTATION_ROTATE_270 -> 270
                else -> 0
            }
        }

        @Throws(IOException::class)
        private fun copyExif(context: Context, oldImage: Uri, newFile: File) {
            val oldFile = getFileFromUri(context, oldImage)
            if (oldFile == null) {
                FLog.w(ReactConstants.TAG, "Couldn't get real path for uri: $oldImage")
                return
            }
            val oldExif = ExifInterface(oldFile.absolutePath)
            val newExif = ExifInterface(newFile.absolutePath)
            for (attribute in EXIF_ATTRIBUTES) {
                val value = oldExif.getAttribute(attribute)
                if (value != null) {
                    newExif.setAttribute(attribute, value)
                }
            }
            newExif.saveAttributes()
        }

        private fun getFileFromUri(context: Context, uri: Uri): File? {
            if (uri.scheme == "file") {
                return uri.path?.let { File(it) }
            }
            if (uri.scheme == "content") {
                context.contentResolver
                    .query(uri, arrayOf(MediaStore.MediaColumns.DATA), null, null, null)
                    ?.use { cursor ->
                        if (cursor.moveToFirst()) {
                            val path = cursor.getString(0)
                            if (!TextUtils.isEmpty(path)) {
                                return File(path)
                            }
                        }
                    }
            }
            return null
        }

        private fun isLocalUri(uri: String): Boolean {
            for (localPrefix in LOCAL_URI_PREFIXES) {
                if (uri.startsWith(localPrefix)) {
                    return true
                }
            }
            return false
        }

        private fun getFileExtensionForType(mimeType: String?): String {
            return when (mimeType) {
                MimeType.PNG -> ".png"
                MimeType.WEBP -> ".webp"
                else -> ".jpg"
            }
        }

        private fun getCompressFormatForType(mimeType: String): CompressFormat {
            val webpCompressFormat =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    CompressFormat.WEBP_LOSSY
                } else {
                    @Suppress("DEPRECATION") CompressFormat.WEBP
                }
            return when (mimeType) {
                MimeType.PNG -> CompressFormat.PNG
                MimeType.WEBP -> webpCompressFormat
                else -> CompressFormat.JPEG
            }
        }

        @Throws(IOException::class)
        private fun writeCompressedBitmapToFile(
            cropped: Bitmap,
            mimeType: String,
            tempFile: File,
            compressQuality: Int
        ) {
            FileOutputStream(tempFile).use {
                cropped.compress(getCompressFormatForType(mimeType), compressQuality, it)
            }
        }

        /**
         * Create a temporary file in the cache directory on either internal or external storage,
         * whichever is available and has more free space.
         *
         * @param mimeType the MIME type of the file to create (image/ *)
         */
        @Throws(IOException::class)
        private fun createTempFile(context: Context, mimeType: String?): File {
            val externalCacheDir = context.externalCacheDir
            val internalCacheDir = context.cacheDir
            if (externalCacheDir == null && internalCacheDir == null) {
                throw IOException("No cache directory available")
            }
            val cacheDir: File? =
                if (externalCacheDir == null) {
                    internalCacheDir
                } else if (internalCacheDir == null) {
                    externalCacheDir
                } else {
                    if (externalCacheDir.freeSpace > internalCacheDir.freeSpace) externalCacheDir
                    else internalCacheDir
                }
            return File.createTempFile(
                TEMP_FILE_PREFIX,
                getFileExtensionForType(mimeType),
                cacheDir
            )
        }

        /**
         * When scaling down the bitmap, decode only every n-th pixel in each dimension. Calculate
         * the largest `inSampleSize` value that is a power of 2 and keeps both `width, height`
         * larger or equal to `targetWidth, targetHeight`. This can significantly reduce memory
         * usage.
         */
        private fun getDecodeSampleSize(
            width: Int,
            height: Int,
            targetWidth: Int,
            targetHeight: Int
        ): Int {
            var inSampleSize = 1
            if (height > targetHeight || width > targetWidth) {
                val halfHeight = height / 2
                val halfWidth = width / 2
                while (
                    halfWidth / inSampleSize >= targetWidth &&
                        halfHeight / inSampleSize >= targetHeight
                ) {
                    inSampleSize *= 2
                }
            }
            return inSampleSize
        }
    }
}
