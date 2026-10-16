package com.vexedit.studio

import com.vexedit.studio.engine.KeyframeInterpolator
import com.vexedit.studio.engine.TimelineEngine
import com.vexedit.studio.engine.UndoRedoManager
import com.vexedit.studio.model.Clip
import com.vexedit.studio.model.Keyframe
import com.vexedit.studio.model.Project
import com.vexedit.studio.model.TransformValues
import org.junit.Assert.*
import org.junit.Test

class TimelineEngineTest {

    @Test
    fun clipDurationOnTimelineMs_computesCorrectlyWithSpeed() {
        val normalClip = Clip(trackId = "video-1", sourceDurationMs = 4000L, speed = 1f)
        assertEquals(4000L, normalClip.durationOnTimelineMs)

        val doubleSpeedClip = Clip(trackId = "video-1", sourceDurationMs = 4000L, speed = 2f)
        assertEquals(2000L, doubleSpeedClip.durationOnTimelineMs)

        val slowMoClip = Clip(trackId = "video-1", sourceDurationMs = 4000L, speed = 0.5f)
        assertEquals(8000L, slowMoClip.durationOnTimelineMs)
    }

    @Test
    fun projectDurationMs_aggregatesAllClips() {
        val project = Project(
            title = "Test Project",
            clips = listOf(
                Clip(trackId = "video-1", positionMs = 0L, sourceDurationMs = 5000L),
                Clip(trackId = "video-1", positionMs = 5000L, sourceDurationMs = 3000L),
                Clip(trackId = "audio-1", positionMs = 0L, sourceDurationMs = 12000L)
            )
        )

        assertEquals(12000L, project.durationMs)
    }

    @Test
    fun splitClip_createsLeftAndRightWithContinuousSourceTimeAndInterpolatedKeyframe() {
        val initialClip = Clip(
            id = "test-clip",
            trackId = "video-1",
            positionMs = 1000L,
            sourceStartMs = 2000L,
            sourceDurationMs = 6000L,
            speed = 1f,
            keyframes = listOf(
                Keyframe(timeMs = 0L, values = TransformValues(scale = 100f)),
                Keyframe(timeMs = 6000L, values = TransformValues(scale = 160f))
            )
        )

        val project = Project(title = "Split Test", clips = listOf(initialClip))

        // Split at timeline position 4000ms (3000ms into clip)
        val splitProject = TimelineEngine.splitClip(project, "test-clip", 4000L)
        assertNotNull(splitProject)

        val clips = splitProject!!.clips
        assertEquals(2, clips.size)

        val left = clips[0]
        val right = clips[1]

        assertEquals(1000L, left.positionMs)
        assertEquals(3000L, left.sourceDurationMs)
        assertEquals(2000L, left.sourceStartMs)

        assertEquals(4000L, right.positionMs)
        assertEquals(3000L, right.sourceDurationMs)
        assertEquals(5000L, right.sourceStartMs)

        // Interpolated scale at midpoint should be 130%
        assertEquals(130f, right.transform.scale, 0.01f)
    }

    @Test
    fun splitClip_rejectsEdgeCasesUnder100ms() {
        val clip = Clip(id = "edge-clip", trackId = "video-1", positionMs = 0L, sourceDurationMs = 5000L)
        val project = Project(title = "Edge Test", clips = listOf(clip))

        // Too close to start (< 100ms)
        assertNull(TimelineEngine.splitClip(project, "edge-clip", 50L))

        // Too close to end (> 4900ms)
        assertNull(TimelineEngine.splitClip(project, "edge-clip", 4950L))
    }

    @Test
    fun duplicateClip_appendsToTrackEnd() {
        val clip = Clip(id = "c1", trackId = "video-1", positionMs = 0L, sourceDurationMs = 4000L)
        val project = Project(title = "Dup Test", clips = listOf(clip))

        val updated = TimelineEngine.duplicateClip(project, "c1")
        assertEquals(2, updated.clips.size)

        val duplicated = updated.clips[1]
        assertEquals(4000L, duplicated.positionMs)
        assertNotEquals("c1", duplicated.id)
    }

    @Test
    fun deleteClip_removesSelectedClip() {
        val clip1 = Clip(id = "c1", trackId = "video-1", positionMs = 0L)
        val clip2 = Clip(id = "c2", trackId = "video-1", positionMs = 4000L)
        val project = Project(title = "Del Test", clips = listOf(clip1, clip2))

        val updated = TimelineEngine.deleteClip(project, "c1")
        assertEquals(1, updated.clips.size)
        assertEquals("c2", updated.clips[0].id)
    }

    @Test
    fun undoRedoManager_managesHistoryAccurately() {
        val manager = UndoRedoManager(maxHistory = 5)
        val p1 = Project(title = "Step 1")
        val p2 = Project(title = "Step 2")
        val p3 = Project(title = "Step 3")

        assertFalse(manager.canUndo)
        assertFalse(manager.canRedo)

        manager.pushState(p1)
        manager.pushState(p2)

        assertTrue(manager.canUndo)
        assertFalse(manager.canRedo)

        val undone = manager.undo(p3)
        assertEquals(p2.id, undone?.id)
        assertTrue(manager.canRedo)

        val redone = manager.redo(undone!!)
        assertEquals(p3.id, redone?.id)
    }
}
