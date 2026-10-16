package com.vexedit.studio

import com.vexedit.studio.data.ProjectRepository
import com.vexedit.studio.model.AspectRatio
import org.junit.Assert.*
import org.junit.Test

class ProjectRepositoryTest {

    @Test
    fun createProject_addsProjectToList() {
        val initialCount = ProjectRepository.projects.value.size
        val created = ProjectRepository.createProject("My Test Video", AspectRatio.RATIO_9_16)

        assertEquals("My Test Video", created.title)
        assertEquals(AspectRatio.RATIO_9_16, created.ratio)
        assertEquals(initialCount + 1, ProjectRepository.projects.value.size)
        assertTrue(ProjectRepository.projects.value.any { it.id == created.id })
    }

    @Test
    fun duplicateProject_createsDistinctCopy() {
        val original = ProjectRepository.createProject("Source Video")
        val copy = ProjectRepository.duplicateProject(original.id)

        assertNotNull(copy)
        assertNotEquals(original.id, copy!!.id)
        assertTrue(copy.title.contains("(Copy)"))
    }

    @Test
    fun renameProject_updatesTitle() {
        val project = ProjectRepository.createProject("Old Name")
        ProjectRepository.renameProject(project.id, "Brand New Name")

        val fetched = ProjectRepository.getProject(project.id)
        assertEquals("Brand New Name", fetched?.title)
    }

    @Test
    fun toggleFavorite_invertsFavoriteStatus() {
        val project = ProjectRepository.createProject("Favorite Test")
        assertFalse(project.isFavorite)

        ProjectRepository.toggleFavorite(project.id)
        assertTrue(ProjectRepository.getProject(project.id)!!.isFavorite)

        ProjectRepository.toggleFavorite(project.id)
        assertFalse(ProjectRepository.getProject(project.id)!!.isFavorite)
    }
}
