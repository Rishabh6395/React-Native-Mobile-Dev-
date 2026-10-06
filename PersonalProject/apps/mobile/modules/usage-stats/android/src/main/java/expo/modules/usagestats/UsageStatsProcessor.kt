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
    fun processEvents(events: UsageEvents, startMs: Long, endMs: Long): Map<String, AppUsageData> {
        val usageMap = mutableMapOf<String, AppUsageData>()
        val currentSessions = mutableMapOf<String, Long>()

        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val pkg = event.packageName
            val time = event.timeStamp
            
            val clampedTime = time.coerceIn(startMs, endMs)

            if (!usageMap.containsKey(pkg)) {
                usageMap[pkg] = AppUsageData(packageName = pkg)
            }
            val data = usageMap[pkg]!!

            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                if (!currentSessions.containsKey(pkg)) {
                    currentSessions[pkg] = clampedTime
                    data.launches += 1
                }
            } else if (event.eventType == UsageEvents.Event.ACTIVITY_PAUSED || event.eventType == UsageEvents.Event.ACTIVITY_STOPPED) {
                if (currentSessions.containsKey(pkg)) {
                    val sessionStart = currentSessions.remove(pkg)!!
                    val sessionDuration = clampedTime - sessionStart
                    if (sessionDuration > 0) {
                        data.foregroundMs += sessionDuration
                        data.sessions += 1
                        
                        if (isNightTime(sessionStart) || isNightTime(clampedTime)) {
                            data.nightMs += sessionDuration
                        }
                    }
                }
            }
        }
        
        for ((pkg, sessionStart) in currentSessions) {
            val data = usageMap[pkg]!!
            val sessionDuration = endMs - sessionStart
            if (sessionDuration > 0) {
                data.foregroundMs += sessionDuration
                data.sessions += 1
                if (isNightTime(sessionStart) || isNightTime(endMs)) {
                    data.nightMs += sessionDuration
                }
            }
        }

        return usageMap
    }
    
    fun getHourlyUsage(events: UsageEvents, startMs: Long, endMs: Long): List<HourBucket> {
        val buckets = Array(24) { HourBucket(it) }
        val currentSessions = mutableMapOf<String, Long>()
        
        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val pkg = event.packageName
            val time = event.timeStamp
            
            val clampedTime = time.coerceIn(startMs, endMs)

            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                if (!currentSessions.containsKey(pkg)) {
                    currentSessions[pkg] = clampedTime
                }
            } else if (event.eventType == UsageEvents.Event.ACTIVITY_PAUSED || event.eventType == UsageEvents.Event.ACTIVITY_STOPPED) {
                if (currentSessions.containsKey(pkg)) {
                    val sessionStart = currentSessions.remove(pkg)!!
                    addDurationToBuckets(buckets, sessionStart, clampedTime)
                }
            }
        }
        
        for ((_, sessionStart) in currentSessions) {
            addDurationToBuckets(buckets, sessionStart, endMs)
        }
        
        return buckets.toList()
    }
    
    fun getSessions(events: UsageEvents, startMs: Long, endMs: Long): List<SessionData> {
        val sessionsList = mutableListOf<SessionData>()
        val currentSessions = mutableMapOf<String, Long>()
        
        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val pkg = event.packageName
            val time = event.timeStamp
            
            val clampedTime = time.coerceIn(startMs, endMs)

            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                if (!currentSessions.containsKey(pkg)) {
                    currentSessions[pkg] = clampedTime
                }
            } else if (event.eventType == UsageEvents.Event.ACTIVITY_PAUSED || event.eventType == UsageEvents.Event.ACTIVITY_STOPPED) {
                if (currentSessions.containsKey(pkg)) {
                    val sessionStart = currentSessions.remove(pkg)!!
                    sessionsList.add(SessionData(pkg, sessionStart, clampedTime))
                }
            }
        }
        
        for ((pkg, sessionStart) in currentSessions) {
            sessionsList.add(SessionData(pkg, sessionStart, endMs))
        }
        
        return sessionsList
    }

    private fun addDurationToBuckets(buckets: Array<HourBucket>, start: Long, end: Long) {
        val cal = java.util.Calendar.getInstance()
        cal.timeInMillis = start
        
        var currentMs = start
        while (currentMs < end) {
            cal.timeInMillis = currentMs
            val hour = cal.get(java.util.Calendar.HOUR_OF_DAY)
            
            cal.set(java.util.Calendar.MINUTE, 59)
            cal.set(java.util.Calendar.SECOND, 59)
            cal.set(java.util.Calendar.MILLISECOND, 999)
            val endOfHour = cal.timeInMillis
            
            val durationInThisHour = minOf(end, endOfHour) - currentMs + 1
            if (durationInThisHour > 0) {
                buckets[hour].foregroundMs += durationInThisHour
            }
            currentMs = endOfHour + 1
        }
    }

    private fun isNightTime(timeMs: Long): Boolean {
        val cal = java.util.Calendar.getInstance()
        cal.timeInMillis = timeMs
        val hour = cal.get(java.util.Calendar.HOUR_OF_DAY)
        return hour >= 22 || hour < 6
    }
}
