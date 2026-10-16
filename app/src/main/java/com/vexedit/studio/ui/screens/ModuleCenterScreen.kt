package com.vexedit.studio.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexedit.studio.ui.theme.*

data class ModuleItem(
    val id: String,
    val name: String,
    val version: String,
    val size: String,
    val status: String, // "Installed", "Available", "Update Available", "Downloading"
    val progress: Int = 0
)

@Composable
fun ModuleCenterScreen(
    onBack: () -> Unit
) {
    var selectedCategory by remember { mutableStateOf("All") }
    var selectedFilter by remember { mutableStateOf("All Modules") }

    val categories = listOf("All", "Video", "Audio", "Effects", "Utilities")
    val filters = listOf("All Modules", "Installed", "Available")

    val moduleList = remember {
        mutableStateListOf(
            ModuleItem("1", "Audio Toolkit", "v1.2", "38.5 MB", "Update Available"),
            ModuleItem("2", "Cinematic Effects", "v2.0", "72 MB", "Installed"),
            ModuleItem("3", "Color Grading", "v1.5", "55 MB", "Installed"),
            ModuleItem("4", "Transition Pack", "v1.1", "29 MB", "Available"),
            ModuleItem("5", "Keyframe Tools", "v2.2", "41 MB", "Installed")
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(VexBackground)
    ) {
        // Top App Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Text(
                    text = "Module Center",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = VexTextPrimary
                )
            }
            IconButton(onClick = { }) {
                Icon(Icons.Default.Search, contentDescription = "Search", tint = Color.White)
            }
        }

        // Category Tabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            categories.forEach { cat ->
                val isSelected = cat == selectedCategory
                Column(
                    modifier = Modifier.clickable { selectedCategory = cat },
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = cat,
                        fontSize = 13.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                        color = if (isSelected) VexPurple else VexTextSecondary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .height(2.dp)
                            .width(28.dp)
                            .background(if (isSelected) VexPurple else Color.Transparent)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Hero Card: Cinematic Effects Pack
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .background(VexPanel, VexShapes.small)
                .border(1.dp, VexBorder, VexShapes.small)
                .padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .background(VexPurpleDark, VexShapes.small)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Cinematic Effects Pack",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "Enhance your film creations",
                        fontSize = 12.sp,
                        color = VexTextSecondary
                    )
                }
                Button(
                    onClick = { },
                    shape = VexShapes.small,
                    colors = ButtonDefaults.buttonColors(containerColor = VexPurple),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text("Install", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Filter By row: All Modules | Installed | Available
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Filter By: ", fontSize = 12.sp, color = VexTextSecondary)
            Spacer(modifier = Modifier.width(8.dp))
            filters.forEach { filt ->
                val isSelected = filt == selectedFilter
                Box(
                    modifier = Modifier
                        .background(if (isSelected) VexPanelLight else VexPanel, VexShapes.small)
                        .border(1.dp, if (isSelected) VexPurple else VexBorder, VexShapes.small)
                        .clickable { selectedFilter = filt }
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = filt,
                        fontSize = 11.sp,
                        color = if (isSelected) Color.White else VexTextSecondary
                    )
                }
                Spacer(modifier = Modifier.width(6.dp))
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Modules List
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(moduleList) { module ->
                ModuleRowItem(
                    module = module,
                    onAction = {
                        val index = moduleList.indexOf(module)
                        if (index >= 0) {
                            val newStatus = when (module.status) {
                                "Available" -> "Installed"
                                "Installed" -> "Available"
                                "Update Available" -> "Installed"
                                else -> "Available"
                            }
                            moduleList[index] = module.copy(status = newStatus)
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun ModuleRowItem(
    module: ModuleItem,
    onAction: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(VexPanel, VexShapes.small)
            .border(1.dp, VexBorder, VexShapes.small)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(VexPanelLight, VexShapes.small)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = module.name,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = Color.White
            )
            Text(
                text = "${module.version} | ${module.size}",
                fontSize = 11.sp,
                color = VexTextSecondary
            )
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = module.status,
                fontSize = 10.sp,
                color = if (module.status.contains("Update")) Color(0xFFFBBF24) else VexTextSecondary
            )
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedButton(
                onClick = onAction,
                shape = VexShapes.small,
                border = ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(VexBorder)),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = VexPanelLight,
                    contentColor = Color.White
                ),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp),
                modifier = Modifier.height(28.dp)
            ) {
                val buttonText = when (module.status) {
                    "Installed" -> "Remove"
                    "Available" -> "Install"
                    "Update Available" -> "Update"
                    else -> "Action"
                }
                Text(buttonText, fontSize = 11.sp)
            }
        }
    }
}
