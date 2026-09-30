package com.college.archive.service;

import com.college.archive.dto.LookupDto;
import com.college.archive.entity.Category;
import com.college.archive.exception.BadRequestException;
import com.college.archive.exception.ConflictException;
import com.college.archive.exception.ResourceNotFoundException;
import com.college.archive.repository.CategoryRepository;
import com.college.archive.repository.ProjectRepository;
import com.college.archive.repository.ResearchPaperRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Admin-managed categories, shared by projects (category) and papers (research category). */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProjectRepository projectRepository;
    private final ResearchPaperRepository paperRepository;

    @Transactional
    public LookupDto create(String rawName) {
        String name = clean(rawName);
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("A category named '" + name + "' already exists");
        }
        Category saved = categoryRepository.save(new Category(name));
        return new LookupDto(saved.getId(), saved.getName());
    }

    @Transactional
    public LookupDto update(Long id, String rawName) {
        Category category = find(id);
        String name = clean(rawName);
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ConflictException("A category named '" + name + "' already exists");
        }
        category.setName(name);
        return new LookupDto(category.getId(), category.getName());
    }

    @Transactional
    public void delete(Long id) {
        Category category = find(id);
        if (projectRepository.existsByCategoryId(id) || paperRepository.existsByCategoryId(id)) {
            throw new ConflictException("This category is used by existing submissions. Rename it instead of deleting it.");
        }
        categoryRepository.delete(category);
    }

    private Category find(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    private String clean(String raw) {
        String name = raw == null ? "" : raw.trim().replaceAll("\\s+", " ");
        if (name.isEmpty()) throw new BadRequestException("Category name is required");
        return name;
    }
}
