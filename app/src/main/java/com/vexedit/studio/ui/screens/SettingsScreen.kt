package com.vexedit.studio.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexedit.studio.ui.theme.*

@Composable
fun SettingsScreen(
    onBack: () -> Unit
) {
    var language by remember { mutableStateOf("English") }
    var performanceProfile by remember { mutableStateOf("Medium") }
    var previewQuality by remember { mutableStateOf("720p") }
    var cacheCleared by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(VexBackground)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Top App Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
            }
            Text(
                text = "Settings",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = VexTextPrimary
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Language Section
        SettingsCard(title = "Interface Language") {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SettingsSelectButton(
                    label = "English",
                    isSelected = language == "English",
                    modifier = Modifier.weight(1f)
                ) { language = "English" }

                SettingsSelectButton(
                    label = "Türkçe",
                    isSelected = language == "Türkçe",
                    modifier = Modifier.weight(1f)
                ) { language = "Türkçe" }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Performance Profile Section
        SettingsCard(title = "Performance Profile") {
            Text(
                text = "Controls background decoding, cache retention, and render thread budget.",
                fontSize = 11.sp,
                color = VexTextSecondary,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("Low", "Medium", "High").forEach { profile ->
                    SettingsSelectButton(
                        label = profile,
                        isSelected = performanceProfile == profile,
                        modifier = Modifier.weight(1f)
                    ) { performanceProfile = profile }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Preview Quality Section
        SettingsCard(title = "Preview Quality") {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("480p", "720p", "1080p").forEach { quality ->
                    SettingsSelectButton(
                        label = quality,
                        isSelected = previewQuality == quality,
                        modifier = Modifier.weight(1f)
                    ) { previewQuality = quality }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Storage & Cache Management
        SettingsCard(title = "Storage & Cache") {
            Text(
                text = "Cached timeline thumbnails and audio waveforms: 148 MB",
                fontSize = 12.sp,
                color = VexTextSecondary,
                modifier = Modifier.padding(bottom = 12.dp)
            )
            Button(
                onClick = { cacheCleared = true },
                shape = VexShapes.small,
                colors = ButtonDefaults.buttonColors(containerColor = if (cacheCleared) Color(0xFF10B981) else VexPanelLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = if (cacheCleared) "Cache Cleared!" else "Clear Cache",
                    fontSize = 13.sp,
                    color = Color.White
                )
            }
        }
    }
}

@Composable
fun SettingsCard(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(VexPanel, VexShapes.small)
            .border(1.dp, VexBorder, VexShapes.small)
            .padding(14.dp)
    ) {
        Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Spacer(modifier = Modifier.height(10.dp))
        content()
    }
}

@Composable
fun SettingsSelectButton(
    label: String,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(38.dp)
            .background(if (isSelected) VexPurpleDark else VexPanelLight, VexShapes.small)
            .border(1.dp, if (isSelected) VexPurple else VexBorder, VexShapes.small)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            color = Color.White
        )
    }
}
