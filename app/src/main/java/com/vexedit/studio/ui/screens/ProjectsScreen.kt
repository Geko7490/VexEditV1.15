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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexedit.studio.engine.TimelineEngine
import com.vexedit.studio.model.Project
import com.vexedit.studio.ui.theme.*

@Composable
fun ProjectsScreen(
    projects: List<Project>,
    onOpenProject: (String) -> Unit,
    onNewProject: () -> Unit,
    onRenameProject: (String, String) -> Unit,
    onDuplicateProject: (String) -> Unit,
    onDeleteProject: (String) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedTab by remember { mutableStateOf("All") }
    val tabs = listOf("All", "Recent", "Favorites")

    var renameDialogProjectId by remember { mutableStateOf<String?>(null) }
    var renameDialogText by remember { mutableStateOf("") }

    val filteredProjects = remember(projects, searchQuery, selectedTab) {
        projects.filter { proj ->
            val matchesQuery = searchQuery.isBlank() || proj.title.contains(searchQuery, ignoreCase = true)
            val matchesTab = when (selectedTab) {
                "Recent" -> true
                "Favorites" -> proj.isFavorite
                else -> true
            }
            matchesQuery && matchesTab
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(VexBackground)
            .padding(horizontal = 16.dp, vertical = 14.dp)
    ) {
        // Top row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "VexEdit Studio",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = VexTextPrimary
            )
            Button(
                onClick = onNewProject,
                shape = VexShapes.small,
                colors = ButtonDefaults.buttonColors(containerColor = VexPurple),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Text(text = "New Project", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search Projects…", color = VexTextSecondary, fontSize = 14.sp) },
            singleLine = true,
            shape = VexShapes.small,
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = VexPanel,
                unfocusedContainerColor = VexPanel,
                focusedBorderColor = VexPurple,
                unfocusedBorderColor = VexBorder,
                focusedTextColor = VexTextPrimary,
                unfocusedTextColor = VexTextPrimary
            ),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Tabs: All | Recent | Favorites
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            tabs.forEach { tab ->
                val isSelected = selectedTab == tab
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .clickable { selectedTab = tab }
                        .padding(vertical = 6.dp, horizontal = 16.dp)
                ) {
                    Text(
                        text = tab,
                        fontSize = 14.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                        color = if (isSelected) VexPurple else VexTextSecondary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .height(2.dp)
                            .width(36.dp)
                            .background(if (isSelected) VexPurple else Color.Transparent)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Sort row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Sort: Last Edited ▼",
                fontSize = 12.sp,
                color = VexTextSecondary
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // 2-column Grid of project cards
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(filteredProjects) { project ->
                ProjectGridCard(
                    project = project,
                    onOpen = { onOpenProject(project.id) },
                    onRename = {
                        renameDialogProjectId = project.id
                        renameDialogText = project.title
                    },
                    onDuplicate = { onDuplicateProject(project.id) },
                    onDelete = { onDeleteProject(project.id) }
                )
            }
        }
    }

    // Rename Dialog
    if (renameDialogProjectId != null) {
        AlertDialog(
            onDismissRequest = { renameDialogProjectId = null },
            title = { Text("Rename Project", color = VexTextPrimary) },
            text = {
                OutlinedTextField(
                    value = renameDialogText,
                    onValueChange = { renameDialogText = it },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = VexTextPrimary,
                        unfocusedTextColor = VexTextPrimary
                    )
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val id = renameDialogProjectId
                        if (id != null && renameDialogText.isNotBlank()) {
                            onRenameProject(id, renameDialogText.trim())
                        }
                        renameDialogProjectId = null
                    }
                ) {
                    Text("Rename", color = VexPurple)
                }
            },
            dismissButton = {
                TextButton(onClick = { renameDialogProjectId = null }) {
                    Text("Cancel", color = VexTextSecondary)
                }
            },
            containerColor = VexPanel
        )
    }
}

@Composable
fun ProjectGridCard(
    project: Project,
    onOpen: () -> Unit,
    onRename: () -> Unit,
    onDuplicate: () -> Unit,
    onDelete: () -> Unit
) {
    var menuExpanded by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(VexPanel, VexShapes.small)
            .border(1.dp, VexBorder, VexShapes.small)
            .clickable(onClick = onOpen)
    ) {
        // Thumbnail area with 3-dot menu button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp)
                .background(VexPanelLight),
            contentAlignment = Alignment.TopEnd
        ) {
            IconButton(
                onClick = { menuExpanded = true },
                modifier = Modifier.padding(4.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.MoreVert,
                    contentDescription = "Options",
                    tint = Color.White
                )
            }

            DropdownMenu(
                expanded = menuExpanded,
                onDismissRequest = { menuExpanded = false },
                modifier = Modifier.background(VexPanel)
            ) {
                DropdownMenuItem(
                    text = { Text("Open", color = VexTextPrimary) },
                    onClick = { menuExpanded = false; onOpen() }
                )
                DropdownMenuItem(
                    text = { Text("Rename", color = VexTextPrimary) },
                    onClick = { menuExpanded = false; onRename() }
                )
                DropdownMenuItem(
                    text = { Text("Duplicate", color = VexTextPrimary) },
                    onClick = { menuExpanded = false; onDuplicate() }
                )
                DropdownMenuItem(
                    text = { Text("Delete", color = Color(0xFFEF4444)) },
                    onClick = { menuExpanded = false; onDelete() }
                )
            }
        }

        // Info area
        Column(modifier = Modifier.padding(10.dp)) {
            Text(
                text = project.title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = VexTextPrimary,
                maxLines = 1
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = project.ratio.label,
                    fontSize = 11.sp,
                    color = VexTextSecondary
                )
                Text(
                    text = TimelineEngine.formatTimecode(project.durationMs).substring(3, 8),
                    fontSize = 11.sp,
                    color = VexTextSecondary
                )
            }
        }
    }
}
