package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Process
import android.provider.Settings
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import java.util.Calendar

class UsageStatsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("UsageStats")

    Function("hasUsageAccess") {
      val context = appContext.reactContext ?: return@Function false
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
      return@Function mode == AppOpsManager.MODE_ALLOWED
    }

    Function("openUsageAccessSettings") {
      val context = appContext.reactContext ?: return@Function null
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      context.startActivity(intent)
    }

    Function("getDailyUsage") { startMs: Double, endMs: Double ->
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      
      val events = usageStatsManager.queryEvents(startMs.toLong(), endMs.toLong())
      val usageMap = UsageStatsProcessor.processEvents(events, startMs.toLong(), endMs.toLong())
      
      val pm = context.packageManager
      val result = mutableListOf<Map<String, Any>>()
      
      for ((pkg, data) in usageMap) {
          if (data.foregroundMs == 0L) continue
          if (pkg == context.packageName || pkg.contains("launcher") || pkg.contains("systemui")) continue
          
          var appName = pkg
          var category = "Other"
          
          try {
              val appInfo = pm.getApplicationInfo(pkg, 0)
              appName = pm.getApplicationLabel(appInfo).toString()
              category = getCategoryName(appInfo.category)
          } catch (e: PackageManager.NameNotFoundException) {
              // Ignore, keep defaults
          }
          
          result.add(mapOf(
              "packageName" to pkg,
              "appName" to appName,
              "category" to category,
              "foregroundMs" to data.foregroundMs.toDouble(),
              "launches" to data.launches,
              "sessions" to data.sessions,
              "nightMs" to data.nightMs.toDouble()
          ))
      }
      return@Function result
    }
    
    Function("getHourlyUsage") { dayStartMs: Double ->
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      
      val cal = Calendar.getInstance()
      cal.timeInMillis = dayStartMs.toLong()
      cal.add(Calendar.DAY_OF_MONTH, 1)
      val endMs = cal.timeInMillis
      
      val events = usageStatsManager.queryEvents(dayStartMs.toLong(), endMs)
      val buckets = UsageStatsProcessor.getHourlyUsage(events, dayStartMs.toLong(), endMs)
      
      return@Function buckets.map {
          mapOf(
              "hour" to it.hour,
              "foregroundMs" to it.foregroundMs.toDouble()
          )
      }
    }
    
    Function("getRecentSessions") { dayStartMs: Double ->
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      
      val endMs = System.currentTimeMillis()
      val events = usageStatsManager.queryEvents(dayStartMs.toLong(), endMs)
      val sessions = UsageStatsProcessor.getSessions(events, dayStartMs.toLong(), endMs)
      
      return@Function sessions.filter { 
          it.packageName != context.packageName && !it.packageName.contains("launcher") 
      }.map {
          mapOf(
              "packageName" to it.packageName,
              "startMs" to it.startMs.toDouble(),
              "endMs" to it.endMs.toDouble()
          )
      }
    }

    Function("getInstalledApps") {
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      val pm = context.packageManager
      
      val intent = Intent(Intent.ACTION_MAIN, null)
      intent.addCategory(Intent.CATEGORY_LAUNCHER)
      val apps = pm.queryIntentActivities(intent, 0)
      
      val result = mutableListOf<Map<String, Any?>>()
      val processedPackages = mutableSetOf<String>()
      
      for (resolveInfo in apps) {
          val pkg = resolveInfo.activityInfo.packageName
          if (processedPackages.contains(pkg)) continue
          processedPackages.add(pkg)
          
          var appName = pkg
          var category = "Other"
          var iconBase64: String? = null
          
          try {
              val appInfo = pm.getApplicationInfo(pkg, 0)
              appName = pm.getApplicationLabel(appInfo).toString()
              category = getCategoryName(appInfo.category)
              
              val iconDrawable = appInfo.loadIcon(pm)
              iconBase64 = drawableToBase64(iconDrawable)
          } catch (e: Exception) {
              // Ignore
          }
          
          result.add(mapOf(
              "packageName" to pkg,
              "label" to appName,
              "category" to category,
              "iconBase64" to iconBase64
          ))
      }
      
      return@Function result
    }
  }

  private fun getCategoryName(category: Int): String {
      return when (category) {
          ApplicationInfo.CATEGORY_AUDIO -> "Music"
          ApplicationInfo.CATEGORY_VIDEO -> "Video"
          ApplicationInfo.CATEGORY_GAME -> "Games"
          ApplicationInfo.CATEGORY_IMAGE -> "Photography"
          ApplicationInfo.CATEGORY_SOCIAL -> "Social"
          ApplicationInfo.CATEGORY_NEWS -> "News"
          ApplicationInfo.CATEGORY_PRODUCTIVITY -> "Productivity"
          else -> "Other"
      }
  }

  private fun drawableToBase64(drawable: Drawable): String? {
      try {
          val bitmap: Bitmap
          if (drawable is BitmapDrawable && drawable.bitmap != null) {
              bitmap = drawable.bitmap
          } else {
              bitmap = Bitmap.createBitmap(
                  if (drawable.intrinsicWidth <= 0) 1 else drawable.intrinsicWidth,
                  if (drawable.intrinsicHeight <= 0) 1 else drawable.intrinsicHeight,
                  Bitmap.Config.ARGB_8888
              )
              val canvas = Canvas(bitmap)
              drawable.setBounds(0, 0, canvas.width, canvas.height)
              drawable.draw(canvas)
          }
          
          val scaledBitmap = Bitmap.createScaledBitmap(bitmap, 64, 64, true)
          
          val outputStream = ByteArrayOutputStream()
          scaledBitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
          val byteArray = outputStream.toByteArray()
          return "data:image/png;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)
      } catch (e: Exception) {
          return null
      }
  }
}
