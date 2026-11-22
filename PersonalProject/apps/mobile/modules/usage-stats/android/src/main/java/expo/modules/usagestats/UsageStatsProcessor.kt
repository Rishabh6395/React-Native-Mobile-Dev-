package expo.modules.usagestats

import android.app.usage.UsageEvents

class AppUsageData(
    var packageName: String = "",
    var foregroundMs: Long = 0,
    var launches: Int = 0,
    var sessions: Int = 0,
    var nightMs: Long = 0,
    var lastResumeTime: Long = 0
)

class SessionData(
    val packageName: String,
    val startMs: Long,
    var endMs: Long
)

class HourBucket(
    val hour: Int,
    var foregroundMs: Long = 0
)

object UsageStatsProcessor {
    private const val MAX_SESSION_DURATION_MS = 2 * 60 * 60 * 1000L // 2 hours safety ceiling

    fun processEvents(events: UsageEvents, startMs: Long, endMs: Long): Map<String, AppUsageData> {
        val usageMap = mutableMapOf<String, AppUsageData>()
        var currentPkg: String? = null
        var currentSessionStart: Long = 0L

        fun closeCurrentSession(closeTime: Long) {
            val pkg = currentPkg ?: return
            val clampedClose = closeTime.coerceIn(startMs, endMs)
            val rawDuration = clampedClose - currentSessionStart
            val duration = minOf(rawDuration, MAX_SESSION_DURATION_MS)
            if (duration > 0) {
                val data = usageMap.getOrPut(pkg) { AppUsageData(packageName = pkg) }
                data.foregroundMs += duration
                data.sessions += 1
                if (isNightTime(currentSessionStart) || isNightTime(clampedClose)) {
                    data.nightMs += duration
                }
            }
            currentPkg = null
            currentSessionStart = 0L
        }

        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val pkg = event.packageName ?: continue
            val time = event.timeStamp
            val clampedTime = time.coerceIn(startMs, endMs)

            when (event.eventType) {
                UsageEvents.Event.ACTIVITY_RESUMED -> {
                    if (currentPkg != null && currentPkg != pkg) {
                        closeCurrentSession(clampedTime)
                    }
                    if (currentPkg == null) {
                        currentPkg = pkg
                        currentSessionStart = clampedTime
                        val data = usageMap.getOrPut(pkg) { AppUsageData(packageName = pkg) }
                        data.launches += 1
                    }
                }
                UsageEvents.Event.ACTIVITY_PAUSED,
                UsageEvents.Event.ACTIVITY_STOPPED -> {
                    if (currentPkg == pkg) {
                        closeCurrentSession(clampedTime)
                    }
                }
                UsageEvents.Event.SCREEN_NON_INTERACTIVE,
                UsageEvents.Event.KEYGUARD_SHOWN,
                26 /* DEVICE_SHUTDOWN */ -> {
                    closeCurrentSession(clampedTime)
                }
            }
        }

        if (currentPkg != null) {
            closeCurrentSession(endMs)
        }

        return usageMap
    }
    
    fun getHourlyUsage(events: UsageEvents, startMs: Long, endMs: Long): List<HourBucket> {
        val buckets = Array(24) { HourBucket(it) }
        var currentPkg: String? = null
        var currentSessionStart: Long = 0L

        fun closeCurrentSession(closeTime: Long) {
            if (currentPkg == null) return
            val clampedClose = closeTime.coerceIn(startMs, endMs)
            val rawDuration = clampedClose - currentSessionStart
            val duration = minOf(rawDuration, MAX_SESSION_DURATION_MS)
            if (duration > 0) {
                addDurationToBuckets(buckets, currentSessionStart, currentSessionStart + duration)
            }
            currentPkg = null
            currentSessionStart = 0L
        }

        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val pkg = event.packageName ?: continue
            val time = event.timeStamp
            val clampedTime = time.coerceIn(startMs, endMs)

            when (event.eventType) {
                UsageEvents.Event.ACTIVITY_RESUMED -> {
                    if (currentPkg != null && currentPkg != pkg) {
                        closeCurrentSession(clampedTime)
                    }
                    if (currentPkg == null) {
                        currentPkg = pkg
                        currentSessionStart = clampedTime
                    }
                }
                UsageEvents.Event.ACTIVITY_PAUSED,
                UsageEvents.Event.ACTIVITY_STOPPED -> {
                    if (currentPkg == pkg) {
                        closeCurrentSession(clampedTime)
                    }
                }
                UsageEvents.Event.SCREEN_NON_INTERACTIVE,
                UsageEvents.Event.KEYGUARD_SHOWN,
                26 /* DEVICE_SHUTDOWN */ -> {
                    closeCurrentSession(clampedTime)
                }
            }
        }

        if (currentPkg != null) {
            closeCurrentSession(endMs)
        }

        return buckets.toList()
    }
    
    fun getSessions(events: UsageEvents, startMs: Long, endMs: Long): List<SessionData> {
        val sessionsList = mutableListOf<SessionData>()
        var currentPkg: String? = null
        var currentSessionStart: Long = 0L

        fun closeCurrentSession(closeTime: Long) {
            val pkg = currentPkg ?: return
            val clampedClose = closeTime.coerceIn(startMs, endMs)
            val rawDuration = clampedClose - currentSessionStart
            val duration = minOf(rawDuration, MAX_SESSION_DURATION_MS)
            if (duration > 0) {
                sessionsList.add(SessionData(pkg, currentSessionStart, currentSessionStart + duration))
            }
            currentPkg = null
            currentSessionStart = 0L
        }

        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val pkg = event.packageName ?: continue
            val time = event.timeStamp
            val clampedTime = time.coerceIn(startMs, endMs)

            when (event.eventType) {
                UsageEvents.Event.ACTIVITY_RESUMED -> {
                    if (currentPkg != null && currentPkg != pkg) {
                        closeCurrentSession(clampedTime)
                    }
                    if (currentPkg == null) {
                        currentPkg = pkg
                        currentSessionStart = clampedTime
                    }
                }
                UsageEvents.Event.ACTIVITY_PAUSED,
                UsageEvents.Event.ACTIVITY_STOPPED -> {
                    if (currentPkg == pkg) {
                        closeCurrentSession(clampedTime)
                    }
                }
                UsageEvents.Event.SCREEN_NON_INTERACTIVE,
                UsageEvents.Event.KEYGUARD_SHOWN,
                26 /* DEVICE_SHUTDOWN */ -> {
                    closeCurrentSession(clampedTime)
                }
            }
        }

        if (currentPkg != null) {
            closeCurrentSession(endMs)
        }

        return sessionsList
    }

    private fun addDurationToBuckets(buckets: Array<HourBucket>, start: Long, end: Long) {
        if (start >= end) return
        val cal = java.util.Calendar.getInstance()
        var currentMs = start

        while (currentMs < end) {
            cal.timeInMillis = currentMs
            val hour = cal.get(java.util.Calendar.HOUR_OF_DAY)
            
            cal.set(java.util.Calendar.MINUTE, 59)
            cal.set(java.util.Calendar.SECOND, 59)
            cal.set(java.util.Calendar.MILLISECOND, 999)
            val endOfHour = cal.timeInMillis + 1L
            
            val segmentEnd = minOf(end, endOfHour)
            val durationInThisHour = segmentEnd - currentMs
            if (durationInThisHour > 0 && hour in 0..23) {
                buckets[hour].foregroundMs += durationInThisHour
            }
            currentMs = segmentEnd
        }
    }

    private fun isNightTime(timeMs: Long): Boolean {
        val cal = java.util.Calendar.getInstance()
        cal.timeInMillis = timeMs
        val hour = cal.get(java.util.Calendar.HOUR_OF_DAY)
        return hour >= 22 || hour < 6
    }
}
