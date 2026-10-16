package com.vexedit.studio.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexedit.studio.model.MediaAsset
import com.vexedit.studio.model.MediaKind
import com.vexedit.studio.ui.components.AudioWaveformCanvas
import com.vexedit.studio.ui.theme.*

@Composable
fun ImportMediaScreen(
    onBack: () -> Unit,
    onAddSelectedToTimeline: (List<MediaAsset>) -> Unit
) {
    val sampleMediaList = remember {
        listOf(
            MediaAsset("1", "Video_01.mp4", "", MediaKind.VIDEO, 165000L, 1920, 1080),
            MediaAsset("2", "Video_02.mp4", "", MediaKind.VIDEO, 165000L, 1920, 1080),
            MediaAsset("3", "Waterfall.mp4", "", MediaKind.VIDEO, 165000L, 1920, 1080),
            MediaAsset("4", "Ocean.mp4", "", MediaKind.VIDEO, 165000L, 1920, 1080),
            MediaAsset("5", "City_Night.mp4", "", MediaKind.VIDEO, 165000L, 1920, 1080),
            MediaAsset("6", "Sunset_Drive.mp4", "", MediaKind.VIDEO, 165000L, 3840, 2160),
            MediaAsset("7", "Portrait_4K.mp4", "", MediaKind.VIDEO, 165000L, 3840, 2160),
            MediaAsset("8", "Field_Photo.jpg", "", MediaKind.IMAGE, 5000L),
            MediaAsset("9", "Lake_Photo.jpg", "", MediaKind.IMAGE, 5000L),
            MediaAsset("10", "Mountain_4K.mp4", "", MediaKind.VIDEO, 165000L, 3840, 2160),
            MediaAsset("11", "Travel_Photo.jpg", "", MediaKind.IMAGE, 5000L),
            MediaAsset("12", "Friends_Photo.jpg", "", MediaKind.IMAGE, 5000L),
            MediaAsset("13", "background_track.mp3", "", MediaKind.AUDIO, 192000L),
            MediaAsset("14", "ambient_loop.mp3", "", MediaKind.AUDIO, 192000L),
            MediaAsset("15", "cinematic_drums.mp3", "", MediaKind.AUDIO, 192000L),
            MediaAsset("16", "synth_wave.mp3", "", MediaKind.AUDIO, 192000L)
        )
    }

    var selectedKindTab by remember { mutableStateOf(MediaKind.VIDEO) }
    val selectedIds = remember { mutableStateListOf<String>() }

    val filteredMedia = remember(selectedKindTab) {
        sampleMediaList.filter {
            when (selectedKindTab) {
                MediaKind.VIDEO -> it.kind == MediaKind.VIDEO
                MediaKind.IMAGE -> it.kind == MediaKind.IMAGE
                MediaKind.AUDIO -> it.kind == MediaKind.AUDIO
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(VexBackground)
    ) {
        // Top Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Text(
                    text = "Import Media",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = VexTextPrimary
                )
            }
            IconButton(onClick = { /* Search */ }) {
                Icon(Icons.Default.Search, contentDescription = "Search", tint = Color.White)
            }
        }

        // Tabs: Videos | Photos | Audio | Files
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            listOf(
                "Videos" to MediaKind.VIDEO,
                "Photos" to MediaKind.IMAGE,
                "Audio" to MediaKind.AUDIO
            ).forEach { (label, kind) ->
                val isSelected = selectedKindTab == kind
                Button(
                    onClick = { selectedKindTab = kind },
                    shape = VexShapes.small,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isSelected) VexPanelLight else VexPanel
                    ),
                    modifier = Modifier.weight(1f).padding(horizontal = 4.dp)
                ) {
                    Text(
                        text = label,
                        fontSize = 13.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                        color = if (isSelected) Color.White else VexTextSecondary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Subheader: Camera Roll ▼ | Date Modified ▼
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Folder, contentDescription = null, tint = VexTextSecondary, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Camera Roll ▼", fontSize = 13.sp, color = VexTextSecondary)
            }
            Text("Date Modified ▼", fontSize = 13.sp, color = VexTextSecondary)
        }

        // Media 4-column Grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(4),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            items(filteredMedia) { asset ->
                val isSelected = selectedIds.contains(asset.id)
                MediaTile(
                    asset = asset,
                    isSelected = isSelected,
                    onClick = {
                        if (isSelected) selectedIds.remove(asset.id) else selectedIds.add(asset.id)
                    }
                )
            }
        }

        // Bottom Controls Container
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexPanel)
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Text(
                text = "${selectedIds.size} items selected",
                fontSize = 13.sp,
                color = VexTextSecondary,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = {
                        selectedIds.clear()
                        selectedIds.addAll(filteredMedia.map { it.id })
                    },
                    shape = VexShapes.small,
                    colors = ButtonDefaults.buttonColors(containerColor = VexPanelLight),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Select All", fontSize = 12.sp, color = Color.White)
                }
                Button(
                    onClick = { selectedIds.clear() },
                    shape = VexShapes.small,
                    colors = ButtonDefaults.buttonColors(containerColor = VexPanelLight),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Clear Selection", fontSize = 12.sp, color = Color.White)
                }
                Button(
                    onClick = { /* Sort */ },
                    shape = VexShapes.small,
                    colors = ButtonDefaults.buttonColors(containerColor = VexPanelLight),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Sort", fontSize = 12.sp, color = Color.White)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Add to Timeline purple rectangular button
            Button(
                onClick = {
                    val chosen = sampleMediaList.filter { selectedIds.contains(it.id) }
                    onAddSelectedToTimeline(chosen)
                },
                enabled = selectedIds.isNotEmpty(),
                shape = VexShapes.small,
                colors = ButtonDefaults.buttonColors(
                    containerColor = VexPurple,
                    disabledContainerColor = VexPanelLight
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text(
                    text = "Add to Timeline",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
    }
}

@Composable
fun MediaTile(
    asset: MediaAsset,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .aspectRatio(1f)
            .background(VexPanelLight, VexShapes.small)
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = if (isSelected) VexPurple else VexBorder,
                shape = VexShapes.small
            )
            .clickable(onClick = onClick)
    ) {
        if (asset.kind == MediaKind.AUDIO) {
            Column(
                modifier = Modifier.fillMaxSize().padding(6.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.GraphicEq,
                    contentDescription = null,
                    tint = VexPurple,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = asset.name,
                    fontSize = 9.sp,
                    color = VexTextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "03:12",
                    fontSize = 9.sp,
                    color = VexTextSecondary
                )
            }
        } else {
            // Video / Image placeholder icon
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                if (asset.kind == MediaKind.VIDEO) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            // Bottom Badges (duration & resolution)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .background(Color(0x99000000))
                    .padding(horizontal = 4.dp, vertical = 2.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = if (asset.kind == MediaKind.VIDEO) "02:45" else "Photo",
                    fontSize = 9.sp,
                    color = Color.White
                )
                if (asset.kind == MediaKind.VIDEO) {
                    Text(
                        text = if (asset.width > 2000) "4K" else "1080p",
                        fontSize = 9.sp,
                        color = Color.White
                    )
                }
            }
        }

        // Selected Purple Checkmark badge
        if (isSelected) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(4.dp)
                    .size(18.dp)
                    .background(VexPurple, androidx.compose.foundation.shape.CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(12.dp)
                )
            }
        }
    }
}
