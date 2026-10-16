package com.vexedit.studio.engine

import com.vexedit.studio.model.Clip
import com.vexedit.studio.model.Keyframe
import com.vexedit.studio.model.Project
import com.vexedit.studio.model.TransformValues
import java.util.UUID

object KeyframeInterpolator {

    fun interpolate(clip: Clip, localTimeMs: Long): TransformValues {
        val frames = clip.keyframes.sortedBy { it.timeMs }
        if (frames.isEmpty()) return clip.transform
        if (localTimeMs <= frames.first().timeMs) return frames.first().values
        if (localTimeMs >= frames.last().timeMs) return frames.last().values

        val rightIndex = frames.indexOfFirst { it.timeMs >= localTimeMs }
        if (rightIndex <= 0) return frames.first().values
        val left = frames[rightIndex - 1]
        val right = frames[rightIndex]

        val span = (right.timeMs - left.timeMs).toFloat()
        if (span <= 0f) return left.values
        val fraction = ((localTimeMs - left.timeMs) / span).coerceIn(0f, 1f)

        return TransformValues(
            x = left.values.x + (right.values.x - left.values.x) * fraction,
            y = left.values.y + (right.values.y - left.values.y) * fraction,
            scale = left.values.scale + (right.values.scale - left.values.scale) * fraction,
            rotation = left.values.rotation + (right.values.rotation - left.values.rotation) * fraction,
            opacity = left.values.opacity + (right.values.opacity - left.values.opacity) * fraction
        )
    }
}

object TimelineEngine {

    fun splitClip(project: Project, clipId: String, splitPositionMs: Long): Project? {
        val clip = project.clips.find { it.id == clipId } ?: return null
        val localTimeMs = splitPositionMs - clip.positionMs
        val durationMs = clip.durationOnTimelineMs

        // Avoid splitting too close to edges (minimum 100ms)
        if (localTimeMs < 100L || localTimeMs > durationMs - 100L) {
            return null
        }

        val leftSourceDuration = (localTimeMs * clip.speed).toLong()
        val splitTransform = KeyframeInterpolator.interpolate(clip, localTimeMs)

        val leftClip = clip.copy(
            sourceDurationMs = leftSourceDuration,
            keyframes = clip.keyframes.filter { it.timeMs <= localTimeMs }
        )

        val rightClip = clip.copy(
            id = UUID.randomUUID().toString(),
            positionMs = splitPositionMs,
            sourceStartMs = clip.sourceStartMs + leftSourceDuration,
            sourceDurationMs = clip.sourceDurationMs - leftSourceDuration,
            transform = splitTransform,
            keyframes = clip.keyframes
                .filter { it.timeMs > localTimeMs }
                .map { it.copy(id = UUID.randomUUID().toString(), timeMs = it.timeMs - localTimeMs) }
        )

        val updatedClips = project.clips.flatMap {
            if (it.id == clipId) listOf(leftClip, rightClip) else listOf(it)
        }

        return project.copy(
            clips = updatedClips,
            updatedAt = System.currentTimeMillis()
        )
    }

    fun moveClip(project: Project, clipId: String, newPositionMs: Long, newTrackId: String? = null): Project {
        val safePosition = newPositionMs.coerceAtLeast(0L)
        val updated = project.clips.map { clip ->
            if (clip.id == clipId) {
                clip.copy(
                    positionMs = safePosition,
                    trackId = newTrackId ?: clip.trackId
                )
            } else {
                clip
            }
        }
        return project.copy(clips = updated, updatedAt = System.currentTimeMillis())
    }

    fun duplicateClip(project: Project, clipId: String): Project {
        val original = project.clips.find { it.id == clipId } ?: return project
        val trackEnd = getTrackEndMs(project, original.trackId)
        val duplicated = original.copy(
            id = UUID.randomUUID().toString(),
            positionMs = trackEnd,
            keyframes = original.keyframes.map { it.copy(id = UUID.randomUUID().toString()) }
        )
        return project.copy(
            clips = project.clips + duplicated,
            updatedAt = System.currentTimeMillis()
        )
    }

    fun deleteClip(project: Project, clipId: String): Project {
        return project.copy(
            clips = project.clips.filter { it.id != clipId },
            updatedAt = System.currentTimeMillis()
        )
    }

    fun getTrackEndMs(project: Project, trackId: String): Long {
        return project.clips
            .filter { it.trackId == trackId }
            .maxOfOrNull { it.positionMs + it.durationOnTimelineMs } ?: 0L
    }

    fun formatTimecode(ms: Long): String {
        val safe = ms.coerceAtLeast(0L)
        val totalSec = safe / 1000
        val minutes = totalSec / 60
        val seconds = totalSec % 60
        val frames = ((safe % 1000) * 24 / 1000).toInt()
        val hours = minutes / 60
        val remMin = minutes % 60
        return String.format(java.util.Locale.US, "%02d:%02d:%02d:%02d", hours, remMin, seconds, frames)
    }
}

class UndoRedoManager(private val maxHistory: Int = 30) {
    private val past = mutableListOf<Project>()
    private val future = mutableListOf<Project>()

    val canUndo: Boolean get() = past.isNotEmpty()
    val canRedo: Boolean get() = future.isNotEmpty()

    fun pushState(current: Project) {
        past.add(current)
        if (past.size > maxHistory) {
            past.removeAt(0)
        }
        future.clear()
    }

    fun undo(current: Project): Project? {
        if (!canUndo) return null
        val previous = past.removeAt(past.lastIndex)
        future.add(0, current)
        return previous
    }

    fun redo(current: Project): Project? {
        if (!canRedo) return null
        val next = future.removeAt(0)
        past.add(current)
        return next
    }

    fun clear() {
        past.clear()
        future.clear()
    }
}
