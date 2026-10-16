package com.vexedit.studio

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexedit.studio.data.ProjectRepository
import com.vexedit.studio.model.Project
import com.vexedit.studio.ui.screens.*
import com.vexedit.studio.ui.theme.*

enum class AppDestination(val label: String, val icon: ImageVector) {
    HOME("Home", Icons.Default.Home),
    PROJECTS("Projects", Icons.Default.Folder),
    STUDIO("Studio", Icons.Default.Videocam),
    SETTINGS("Settings", Icons.Default.Settings)
}

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            VexEditStudioTheme {
                MainAppScaffold()
            }
        }
    }
}

@Composable
fun MainAppScaffold() {
    val projects by ProjectRepository.projects.collectAsState()

    var currentDestination by remember { mutableStateOf(AppDestination.HOME) }
    var activeProjectId by remember { mutableStateOf<String?>("demo-midnight") }

    // Screen stack for sub-flows (Audio Studio, Effects Lab, Keyframe Editor, Module Center, Import Media)
    var activeSubFlow by remember { mutableStateOf<String?>(null) }

    val activeProject = remember(activeProjectId, projects) {
        projects.find { it.id == activeProjectId } ?: projects.firstOrNull()
    }

    Scaffold(
        bottomBar = {
            // Hide bottom bar when inside sub-flows
            if (activeSubFlow == null) {
                NavigationBar(
                    containerColor = VexPanel,
                    tonalElevation = 0.dp,
                    modifier = Modifier.border(width = 1.dp, color = VexBorder)
                ) {
                    AppDestination.values().forEach { destination ->
                        val isSelected = currentDestination == destination
                        NavigationBarItem(
                            selected = isSelected,
                            onClick = {
                                currentDestination = destination
                                activeSubFlow = null
                            },
                            icon = {
                                Icon(
                                    imageVector = destination.icon,
                                    contentDescription = destination.label
                                )
                            },
                            label = {
                                Text(
                                    text = destination.label,
                                    fontSize = 11.sp,
                                    color = if (isSelected) VexPurple else VexTextSecondary
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = VexPurple,
                                unselectedIconColor = VexTextSecondary,
                                indicatorColor = Color.Transparent
                            )
                        )
                    }
                }
            }
        },
        containerColor = VexBackground
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (activeSubFlow) {
                "IMPORT" -> {
                    ImportMediaScreen(
                        onBack = { activeSubFlow = null },
                        onAddSelectedToTimeline = { chosenAssets ->
                            val current = activeProject
                            if (current != null) {
                                var updated: com.vexedit.studio.model.Project = current
                                chosenAssets.forEach { asset ->
                                    val clip = com.vexedit.studio.model.Clip(
                                        trackId = if (asset.kind == com.vexedit.studio.model.MediaKind.AUDIO) "audio-1" else "video-1",
                                        assetId = asset.id,
                                        positionMs = com.vexedit.studio.engine.TimelineEngine.getTrackEndMs(updated, "video-1"),
                                        sourceDurationMs = asset.durationMs
                                    )
                                    updated = updated.copy(clips = updated.clips + clip)
                                }
                                ProjectRepository.saveProject(updated)
                            }
                            activeSubFlow = null
                            currentDestination = AppDestination.STUDIO
                        }
                    )
                }
                "AUDIO" -> {
                    AudioStudioScreen(onBack = { activeSubFlow = null })
                }
                "EFFECTS" -> {
                    EffectsLabScreen(
                        onBack = { activeSubFlow = null },
                        onApplyEffect = { effectType, intensity ->
                            if (activeProject != null && activeProject.clips.isNotEmpty()) {
                                val firstClip = activeProject.clips.first()
                                val updated = activeProject.copy(
                                    clips = activeProject.clips.map {
                                        if (it.id == firstClip.id) it.copy(effect = effectType, effectIntensity = intensity) else it
                                    }
                                )
                                ProjectRepository.saveProject(updated)
                            }
                            activeSubFlow = null
                        }
                    )
                }
                "KEYFRAMES" -> {
                    KeyframeEditorScreen(
                        onBack = { activeSubFlow = null },
                        onSave = { activeSubFlow = null }
                    )
                }
                "MODULES" -> {
                    ModuleCenterScreen(onBack = { activeSubFlow = null })
                }
                else -> {
                    when (currentDestination) {
                        AppDestination.HOME -> {
                            HomeScreen(
                                projects = projects,
                                onNewProject = {
                                    val created = ProjectRepository.createProject("New Project ${projects.size + 1}")
                                    activeProjectId = created.id
                                    currentDestination = AppDestination.STUDIO
                                },
                                onImportMedia = { activeSubFlow = "IMPORT" },
                                onOpenProject = { id ->
                                    activeProjectId = id
                                    currentDestination = AppDestination.STUDIO
                                },
                                onNavigateToAudio = { activeSubFlow = "AUDIO" },
                                onNavigateToEffects = { activeSubFlow = "EFFECTS" },
                                onNavigateToKeyframes = { activeSubFlow = "KEYFRAMES" },
                                onNavigateToModules = { activeSubFlow = "MODULES" }
                            )
                        }
                        AppDestination.PROJECTS -> {
                            ProjectsScreen(
                                projects = projects,
                                onOpenProject = { id ->
                                    activeProjectId = id
                                    currentDestination = AppDestination.STUDIO
                                },
                                onNewProject = {
                                    val created = ProjectRepository.createProject("New Project ${projects.size + 1}")
                                    activeProjectId = created.id
                                    currentDestination = AppDestination.STUDIO
                                },
                                onRenameProject = { id, title ->
                                    ProjectRepository.renameProject(id, title)
                                },
                                onDuplicateProject = { id ->
                                    ProjectRepository.duplicateProject(id)
                                },
                                onDeleteProject = { id ->
                                    ProjectRepository.deleteProject(id)
                                }
                            )
                        }
                        AppDestination.STUDIO -> {
                            if (activeProject != null) {
                                StudioScreen(
                                    initialProject = activeProject,
                                    onBack = { currentDestination = AppDestination.PROJECTS },
                                    onSaveProject = { proj -> ProjectRepository.saveProject(proj) },
                                    onExportProject = { /* Export */ },
                                    onNavigateToAudio = { activeSubFlow = "AUDIO" },
                                    onNavigateToEffects = { activeSubFlow = "EFFECTS" },
                                    onNavigateToKeyframes = { activeSubFlow = "KEYFRAMES" }
                                )
                            } else {
                                Box(
                                    modifier = Modifier.fillMaxSize().background(VexBackground),
                                    contentAlignment = androidx.compose.ui.Alignment.Center
                                ) {
                                    Text("No Active Project", color = VexTextSecondary)
                                }
                            }
                        }
                        AppDestination.SETTINGS -> {
                            SettingsScreen(onBack = { currentDestination = AppDestination.HOME })
                        }
                    }
                }
            }
        }
    }
}
