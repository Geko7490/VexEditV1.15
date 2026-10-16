package com.vexedit.studio.data

import com.vexedit.studio.model.AspectRatio
import com.vexedit.studio.model.Clip
import com.vexedit.studio.model.EffectType
import com.vexedit.studio.model.Keyframe
import com.vexedit.studio.model.Project
import com.vexedit.studio.model.TransformValues
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

object ProjectRepository {

    private val _projects = MutableStateFlow<List<Project>>(createInitialProjects())
    val projects: StateFlow<List<Project>> = _projects.asStateFlow()

    private fun createInitialProjects(): List<Project> {
        val midnight = Project(
            id = "demo-midnight",
            title = "Midnight Edit",
            ratio = AspectRatio.RATIO_9_16,
            isFavorite = true,
            clips = listOf(
                Clip(
                    id = "clip-1",
                    trackId = "video-1",
                    positionMs = 0L,
                    sourceStartMs = 0L,
                    sourceDurationMs = 6000L,
                    effect = EffectType.CINEMATIC,
                    keyframes = listOf(
                        Keyframe(timeMs = 0L, values = TransformValues(scale = 100f)),
                        Keyframe(timeMs = 3000L, values = TransformValues(scale = 115f))
                    )
                ),
                Clip(
                    id = "clip-2",
                    trackId = "video-1",
                    positionMs = 6000L,
                    sourceStartMs = 1000L,
                    sourceDurationMs = 8000L
                ),
                Clip(
                    id = "clip-audio-1",
                    trackId = "audio-1",
                    positionMs = 0L,
                    sourceStartMs = 0L,
                    sourceDurationMs = 14000L,
                    volume = 90f
                ),
                Clip(
                    id = "clip-text-1",
                    trackId = "overlay-1",
                    text = "TITLES",
                    positionMs = 2000L,
                    sourceStartMs = 0L,
                    sourceDurationMs = 4000L,
                    transform = TransformValues(opacity = 85f)
                )
            )
        )

        val drill = Project(
            id = "demo-drill",
            title = "Drill Music Visual",
            ratio = AspectRatio.RATIO_9_16,
            isFavorite = false,
            clips = listOf(
                Clip(
                    id = "drill-1",
                    trackId = "video-1",
                    positionMs = 0L,
                    sourceStartMs = 0L,
                    sourceDurationMs = 8000L
                )
            )
        )

        val summer = Project(
            id = "demo-summer",
            title = "Summer Memories",
            ratio = AspectRatio.RATIO_9_16,
            isFavorite = true,
            clips = listOf(
                Clip(
                    id = "summer-1",
                    trackId = "video-1",
                    positionMs = 0L,
                    sourceStartMs = 0L,
                    sourceDurationMs = 10000L
                )
            )
        )

        val cinematic = Project(
            id = "demo-cinematic",
            title = "Cinematic Test",
            ratio = AspectRatio.RATIO_16_9,
            isFavorite = false,
            clips = emptyList()
        )

        return listOf(midnight, drill, summer, cinematic)
    }

    fun getProject(id: String): Project? {
        return _projects.value.find { it.id == id }
    }

    fun createProject(title: String, ratio: AspectRatio = AspectRatio.RATIO_16_9): Project {
        val newProj = Project(
            id = UUID.randomUUID().toString(),
            title = title.ifBlank { "Untitled Project" },
            ratio = ratio,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
        _projects.value = listOf(newProj) + _projects.value
        return newProj
    }

    fun saveProject(project: Project) {
        val updated = _projects.value.map {
            if (it.id == project.id) project.copy(updatedAt = System.currentTimeMillis()) else it
        }
        if (updated.none { it.id == project.id }) {
            _projects.value = listOf(project) + _projects.value
        } else {
            _projects.value = updated
        }
    }

    fun duplicateProject(id: String): Project? {
        val orig = getProject(id) ?: return null
        val copy = orig.copy(
            id = UUID.randomUUID().toString(),
            title = "${orig.title} (Copy)",
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
        _projects.value = listOf(copy) + _projects.value
        return copy
    }

    fun renameProject(id: String, newTitle: String) {
        _projects.value = _projects.value.map {
            if (it.id == id) it.copy(title = newTitle, updatedAt = System.currentTimeMillis()) else it
        }
    }

    fun toggleFavorite(id: String) {
        _projects.value = _projects.value.map {
            if (it.id == id) it.copy(isFavorite = !it.isFavorite) else it
        }
    }

    fun deleteProject(id: String) {
        _projects.value = _projects.value.filter { it.id != id }
    }
}
