package com.vexedit.studio.model

import java.util.UUID

enum class AspectRatio(val label: String, val ratio: Float) {
    RATIO_16_9("16:9", 16f / 9f),
    RATIO_9_16("9:16", 9f / 16f),
    RATIO_1_1("1:1", 1f)
}

enum class MediaKind {
    VIDEO, IMAGE, AUDIO
}

enum class TrackKind {
    VIDEO, AUDIO, OVERLAY
}

enum class EffectType(val label: String) {
    NONE("Original"),
    VIOLET_GLOW("Violet Glow"),
    FILM_GRAIN("Film Grain"),
    RGB_SPLIT("RGB Split"),
    NOIR("Noir"),
    WARM("Warm"),
    COOL("Cool"),
    CINEMATIC("Cinematic")
}

data class TransformValues(
    val x: Float = 0f,
    val y: Float = 0f,
    val scale: Float = 100f,
    val rotation: Float = 0f,
    val opacity: Float = 100f
)

data class Keyframe(
    val id: String = UUID.randomUUID().toString(),
    val timeMs: Long,
    val values: TransformValues
)

data class MediaAsset(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val uriString: String,
    val kind: MediaKind,
    val durationMs: Long,
    val width: Int = 0,
    val height: Int = 0
)

data class Clip(
    val id: String = UUID.randomUUID().toString(),
    val trackId: String,
    val assetId: String? = null,
    val text: String? = null,
    val positionMs: Long = 0L,
    val sourceStartMs: Long = 0L,
    val sourceDurationMs: Long = 4000L,
    val speed: Float = 1f,
    val volume: Float = 100f,
    val fadeInMs: Long = 0L,
    val fadeOutMs: Long = 0L,
    val effect: EffectType = EffectType.NONE,
    val effectIntensity: Float = 100f,
    val transform: TransformValues = TransformValues(),
    val keyframes: List<Keyframe> = emptyList()
) {
    val durationOnTimelineMs: Long
        get() = if (speed > 0f) (sourceDurationMs / speed).toLong() else sourceDurationMs
}

data class Track(
    val id: String,
    val name: String,
    val kind: TrackKind,
    val isMuted: Boolean = false,
    val isSolo: Boolean = false
)

data class Project(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val ratio: AspectRatio = AspectRatio.RATIO_16_9,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val isFavorite: Boolean = false,
    val tracks: List<Track> = defaultTracks(),
    val clips: List<Clip> = emptyList()
) {
    val durationMs: Long
        get() = clips.maxOfOrNull { it.positionMs + it.durationOnTimelineMs } ?: 0L

    companion object {
        fun defaultTracks(): List<Track> = listOf(
            Track("video-1", "Video 1", TrackKind.VIDEO),
            Track("audio-1", "Audio 1", TrackKind.AUDIO),
            Track("audio-2", "Audio 2", TrackKind.AUDIO),
            Track("overlay-1", "Text", TrackKind.OVERLAY)
        )
    }
}
