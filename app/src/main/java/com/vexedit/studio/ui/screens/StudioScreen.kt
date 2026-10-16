package com.vexedit.studio.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexedit.studio.engine.TimelineEngine
import com.vexedit.studio.engine.UndoRedoManager
import com.vexedit.studio.model.Clip
import com.vexedit.studio.model.Project
import com.vexedit.studio.model.TrackKind
import com.vexedit.studio.ui.components.AudioWaveformCanvas
import com.vexedit.studio.ui.components.DiamondKeyframeIcon
import com.vexedit.studio.ui.theme.*

@Composable
fun StudioScreen(
    initialProject: Project,
    onBack: () -> Unit,
    onSaveProject: (Project) -> Unit,
    onExportProject: (Project) -> Unit,
    onNavigateToAudio: () -> Unit,
    onNavigateToEffects: () -> Unit,
    onNavigateToKeyframes: () -> Unit
) {
    var project by remember { mutableStateOf(initialProject) }
    val undoRedoManager = remember { UndoRedoManager() }

    var playheadMs by remember { mutableStateOf(15320L) }
    var selectedClipId by remember { mutableStateOf<String?>("clip-1") }
    var isPlaying by remember { mutableStateOf(false) }

    val selectedClip = project.clips.find { it.id == selectedClipId }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(VexBackground)
    ) {
        // Top App Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexBackground)
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Text(
                    text = project.title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = VexTextPrimary,
                    maxLines = 1
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = {
                        val prev = undoRedoManager.undo(project)
                        if (prev != null) project = prev
                    },
                    enabled = undoRedoManager.canUndo
                ) {
                    Icon(Icons.Default.Undo, contentDescription = "Undo", tint = if (undoRedoManager.canUndo) Color.White else VexBorder)
                }
                IconButton(
                    onClick = {
                        val next = undoRedoManager.redo(project)
                        if (next != null) project = next
                    },
                    enabled = undoRedoManager.canRedo
                ) {
                    Icon(Icons.Default.Redo, contentDescription = "Redo", tint = if (undoRedoManager.canRedo) Color.White else VexBorder)
                }
                IconButton(onClick = { onSaveProject(project) }) {
                    Icon(Icons.Default.Save, contentDescription = "Save", tint = Color.White)
                }
                Spacer(modifier = Modifier.width(4.dp))
                Button(
                    onClick = { onExportProject(project) },
                    shape = VexShapes.small,
                    colors = ButtonDefaults.buttonColors(containerColor = VexPurple),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text("EXPORT", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Video Preview Container
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            // Simulated video viewport
            Box(
                modifier = Modifier
                    .fillMaxHeight(0.95f)
                    .aspectRatio(16f / 9f)
                    .background(Color(0xFF0F172A)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "VexEdit Preview Surface",
                    fontSize = 14.sp,
                    color = VexTextSecondary
                )
            }

            // Preview Info Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .background(Color(0x99000000))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Preview: Auto • 720p",
                    fontSize = 12.sp,
                    color = VexTextSecondary
                )
                Icon(
                    imageVector = Icons.Default.Fullscreen,
                    contentDescription = "Fullscreen",
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        // Timecode and Ruler Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexPanel)
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("00:00", fontSize = 11.sp, color = VexTextSecondary)
            Text("00:10", fontSize = 11.sp, color = VexTextSecondary)
            Text(
                text = TimelineEngine.formatTimecode(playheadMs),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = VexPurple
            )
            Text("00:20…", fontSize = 11.sp, color = VexTextSecondary)
        }

        // Multi-Track Timeline (VN / Professional Hybrid)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexBackground)
                .padding(vertical = 4.dp)
        ) {
            // Video 1 Track
            TimelineTrackRow(
                trackLabel = "Video\nVideo 1",
                isHeader = true
            ) {
                Row(modifier = Modifier.fillMaxWidth()) {
                    Box(
                        modifier = Modifier
                            .width(180.dp)
                            .height(50.dp)
                            .background(VexPanelLight, VexShapes.small)
                            .border(2.dp, VexPurple, VexShapes.small)
                            .padding(4.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            DiamondKeyframeIcon(isFilled = true, sizeDp = 10)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Clip 1", fontSize = 11.sp, color = Color.White)
                        }
                    }
                    Spacer(modifier = Modifier.width(4.dp))
                    Box(
                        modifier = Modifier
                            .width(140.dp)
                            .height(50.dp)
                            .background(VexPanel, VexShapes.small)
                            .border(1.dp, VexBorder, VexShapes.small)
                            .padding(4.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        Text("Clip 2", fontSize = 11.sp, color = VexTextSecondary)
                    }
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            // Audio 1 Track
            TimelineTrackRow(trackLabel = "Audio\nAudio 1") {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(38.dp)
                        .background(VexPanel, VexShapes.small)
                        .padding(horizontal = 6.dp)
                ) {
                    AudioWaveformCanvas(barColor = VexWaveformGreen)
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            // Audio 2 Track
            TimelineTrackRow(trackLabel = "Audio 2") {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(34.dp)
                        .background(VexPanel, VexShapes.small)
                        .padding(horizontal = 6.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Text("Engine SFX", fontSize = 10.sp, color = VexTextSecondary)
                    AudioWaveformCanvas(barColor = Color.White, barsCount = 30)
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            // VFX Track
            TimelineTrackRow(trackLabel = "Effects\nVFX") {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(28.dp)
                        .background(VexPanel, VexShapes.small)
                        .padding(horizontal = 8.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Text("Filters", fontSize = 11.sp, color = VexTextSecondary)
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            // Text / Overlays Track
            TimelineTrackRow(trackLabel = "Overlays\nText") {
                Box(
                    modifier = Modifier
                        .width(120.dp)
                        .height(28.dp)
                        .background(VexPanelLight, VexShapes.small)
                        .padding(horizontal = 8.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Text("TITLE", fontSize = 11.sp, color = Color.White)
                }
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Bottom Editing Toolbelt (Edit, Speed, Volume, Effects, Keyframes, Crop)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexPanel)
                .padding(vertical = 8.dp, horizontal = 4.dp),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            EditorToolItem(
                label = "Edit",
                icon = Icons.Default.Tune,
                onClick = { /* Edit options */ }
            )
            EditorToolItem(
                label = "Speed",
                icon = Icons.Default.Speed,
                onClick = {
                    if (selectedClip != null) {
                        undoRedoManager.pushState(project)
                        val newSpeed = if (selectedClip.speed == 1f) 2f else 1f
                        project = project.copy(
                            clips = project.clips.map {
                                if (it.id == selectedClip.id) it.copy(speed = newSpeed) else it
                            }
                        )
                    }
                }
            )
            EditorToolItem(
                label = "Volume",
                icon = Icons.Default.VolumeUp,
                onClick = onNavigateToAudio
            )
            EditorToolItem(
                label = "Effects",
                icon = Icons.Default.AutoAwesome,
                onClick = onNavigateToEffects
            )
            EditorToolItem(
                label = "Keyframes",
                icon = Icons.Default.Diamond,
                onClick = onNavigateToKeyframes
            )
            EditorToolItem(
                label = "Crop",
                icon = Icons.Default.Crop,
                onClick = { /* Crop */ }
            )
        }
    }
}

@Composable
fun TimelineTrackRow(
    trackLabel: String,
    isHeader: Boolean = false,
    content: @Composable () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(if (isHeader) 52.dp else 40.dp)
            .background(VexBackground),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Track Header on Left
        Box(
            modifier = Modifier
                .width(84.dp)
                .fillMaxHeight()
                .background(VexPanel)
                .border(1.dp, VexBorder)
                .padding(horizontal = 6.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            Text(
                text = trackLabel,
                fontSize = 10.sp,
                color = VexTextSecondary,
                lineHeight = 12.sp
            )
        }

        Spacer(modifier = Modifier.width(4.dp))

        // Track Content Area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight(),
            contentAlignment = Alignment.CenterStart
        ) {
            content()
        }
    }
}

@Composable
fun EditorToolItem(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = Color.White,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontSize = 11.sp,
            color = VexTextSecondary
        )
    }
}
