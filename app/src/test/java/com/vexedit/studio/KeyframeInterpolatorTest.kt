package com.vexedit.studio

import com.vexedit.studio.engine.KeyframeInterpolator
import com.vexedit.studio.model.Clip
import com.vexedit.studio.model.Keyframe
import com.vexedit.studio.model.TransformValues
import org.junit.Assert.assertEquals
import org.junit.Test

class KeyframeInterpolatorTest {

    @Test
    fun interpolate_returnsBoundaryValuesOutsideTimeline() {
        val clip = Clip(
            trackId = "video-1",
            keyframes = listOf(
                Keyframe(timeMs = 1000L, values = TransformValues(x = 10f, opacity = 20f)),
                Keyframe(timeMs = 4000L, values = TransformValues(x = 50f, opacity = 100f))
            )
        )

        // Before first keyframe
        val before = KeyframeInterpolator.interpolate(clip, 500L)
        assertEquals(10f, before.x, 0.01f)
        assertEquals(20f, before.opacity, 0.01f)

        // After last keyframe
        val after = KeyframeInterpolator.interpolate(clip, 5000L)
        assertEquals(50f, after.x, 0.01f)
        assertEquals(100f, after.opacity, 0.01f)
    }

    @Test
    fun interpolate_performsLinearInterpolationBetweenKeyframes() {
        val clip = Clip(
            trackId = "video-1",
            keyframes = listOf(
                Keyframe(timeMs = 0L, values = TransformValues(x = 0f, scale = 100f, rotation = 0f)),
                Keyframe(timeMs = 2000L, values = TransformValues(x = 100f, scale = 200f, rotation = 90f))
            )
        )

        // At midpoint 1000ms
        val mid = KeyframeInterpolator.interpolate(clip, 1000L)
        assertEquals(50f, mid.x, 0.01f)
        assertEquals(150f, mid.scale, 0.01f)
        assertEquals(45f, mid.rotation, 0.01f)

        // At quarter point 500ms
        val quarter = KeyframeInterpolator.interpolate(clip, 500L)
        assertEquals(25f, quarter.x, 0.01f)
        assertEquals(125f, quarter.scale, 0.01f)
        assertEquals(22.5f, quarter.rotation, 0.01f)
    }

    @Test
    fun interpolate_handlesEmptyKeyframesSafely() {
        val baseTransform = TransformValues(x = 15f, y = -10f, scale = 120f)
        val clip = Clip(trackId = "video-1", transform = baseTransform, keyframes = emptyList())

        val result = KeyframeInterpolator.interpolate(clip, 3000L)
        assertEquals(baseTransform, result)
    }
}
