package com.vexedit.studio.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexedit.studio.model.Project
import com.vexedit.studio.ui.components.VexBrandLogo
import com.vexedit.studio.ui.theme.*

@Composable
fun HomeScreen(
    projects: List<Project>,
    onNewProject: () -> Unit,
    onImportMedia: () -> Unit,
    onOpenProject: (String) -> Unit,
    onNavigateToAudio: () -> Unit,
    onNavigateToEffects: () -> Unit,
    onNavigateToKeyframes: () -> Unit,
    onNavigateToModules: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(VexBackground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        // Top Brand Bar
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = 24.dp)
        ) {
            VexBrandLogo(sizeDp = 40)
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = "VexEdit Studio",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = VexTextPrimary
            )
        }

        // Ready to create?
        Text(
            text = "Ready to create?",
            fontSize = 22.sp,
            fontWeight = FontWeight.SemiBold,
            color = VexTextPrimary,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // New Project Button (Square-cut, Vex Purple)
        Button(
            onClick = onNewProject,
            shape = VexShapes.small,
            colors = ButtonDefaults.buttonColors(containerColor = VexPurple),
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
        ) {
            Text(
                text = "New Project",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Import Media Button (Outline, square-cut)
        OutlinedButton(
            onClick = onImportMedia,
            shape = VexShapes.small,
            border = ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(VexBorder)),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = VexPanel,
                contentColor = VexTextPrimary
            ),
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
        ) {
            Text(
                text = "Import Media",
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                color = VexTextPrimary
            )
        }

        Spacer(modifier = Modifier.height(30.dp))

        // Recent Projects section
        Text(
            text = "Recent Projects",
            fontSize = 18.sp,
            fontWeight = FontWeight.SemiBold,
            color = VexTextPrimary,
            modifier = Modifier.padding(bottom = 14.dp)
        )

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(projects) { project ->
                RecentProjectCard(project = project, onClick = { onOpenProject(project.id) })
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Quick Access tools section
        Text(
            text = "Quick Access tools",
            fontSize = 18.sp,
            fontWeight = FontWeight.SemiBold,
            color = VexTextPrimary,
            modifier = Modifier.padding(bottom = 14.dp)
        )

        // 2x2 Grid
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                QuickToolButton(
                    title = "Audio\nStudio",
                    icon = Icons.Default.Audiotrack,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToAudio
                )
                QuickToolButton(
                    title = "Effects\nLab",
                    icon = Icons.Default.AutoAwesome,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToEffects
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                QuickToolButton(
                    title = "Keyframe\nEditor",
                    icon = Icons.Default.Tune,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToKeyframes
                )
                QuickToolButton(
                    title = "Module\nCenter",
                    icon = Icons.Default.Category,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToModules
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Storage & Sync Status readout
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexPanel, VexShapes.small)
                .padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Available: 15.2 GB",
                fontSize = 12.sp,
                color = VexTextSecondary
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "Drafts Synced",
                    fontSize = 12.sp,
                    color = VexTextSecondary
                )
                Spacer(modifier = Modifier.width(6.dp))
                Icon(
                    imageVector = Icons.Default.Sync,
                    contentDescription = null,
                    tint = VexPurple,
                    modifier = Modifier.size(14.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
fun RecentProjectCard(project: Project, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(170.dp)
            .clickable(onClick = onClick)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(96.dp)
                .background(VexPanel, VexShapes.small)
                .border(1.dp, VexBorder, VexShapes.small),
            contentAlignment = Alignment.Center
        ) {
            // Play Button circle
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(Color(0x99000000), androidx.compose.foundation.shape.CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.PlayArrow,
                    contentDescription = "Play",
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = project.title,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = VexTextPrimary,
            maxLines = 1
        )
        Text(
            text = "${project.ratio.label} • ${project.clips.size} clips",
            fontSize = 11.sp,
            color = VexTextSecondary
        )
    }
}

@Composable
fun QuickToolButton(
    title: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Row(
        modifier = modifier
            .height(72.dp)
            .background(VexPanel, VexShapes.small)
            .border(1.dp, VexBorder, VexShapes.small)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .background(VexBackground, VexShapes.small),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(22.dp)
            )
        }
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            text = title,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = VexTextPrimary,
            lineHeight = 16.sp
        )
    }
}
