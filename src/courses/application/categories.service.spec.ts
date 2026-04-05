import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';

import type { TestingModule } from '@nestjs/testing';

import { CategoriesService } from './categories.service';
import { CategoryRepository } from '../infrastructure/category.repository';
import { Category } from '../domain/entities/category.entity';

import type { CreateCategoryDto } from './dto/create-category.dto';

const createMockCategory = (
  overrides: Partial<Category> = {},
): Category => {
  const cat = new Category();
  cat.id = 'cat-uuid-001';
  cat.name = 'Cumplimiento Normativo';
  cat.description = 'Cursos sobre regulaciones';
  cat.parentId = null;
  cat.children = [];
  Object.assign(cat, overrides);
  return cat;
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: jest.Mocked<CategoryRepository>;

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findTree: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<CategoryRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoryRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('create', () => {
    it('should create a root category', async () => {
      const dto: CreateCategoryDto = {
        name: 'Cumplimiento Normativo',
        description: 'Cursos sobre regulaciones',
      };

      repo.findByName.mockResolvedValue(null);
      repo.create.mockResolvedValue(createMockCategory());

      const result = await service.create(dto);

      expect(result.name).toBe('Cumplimiento Normativo');
      expect(result.parentId).toBeNull();
    });

    it('should create a nested category with parentId', async () => {
      const dto: CreateCategoryDto = {
        name: 'Anti-Lavado',
        parentId: 'cat-uuid-001',
      };

      repo.findByName.mockResolvedValue(null);
      repo.findById.mockResolvedValue(createMockCategory());
      repo.create.mockResolvedValue(
        createMockCategory({
          id: 'cat-uuid-002',
          name: 'Anti-Lavado',
          parentId: 'cat-uuid-001',
        }),
      );

      const result = await service.create(dto);

      expect(result.parentId).toBe('cat-uuid-001');
    });

    it('should throw ConflictException when name already exists', async () => {
      repo.findByName.mockResolvedValue(createMockCategory());

      await expect(
        service.create({ name: 'Cumplimiento Normativo' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when parent not found', async () => {
      repo.findByName.mockResolvedValue(null);
      repo.findById.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Sub-cat', parentId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findTree', () => {
    it('should return category tree structure', async () => {
      const tree = [
        createMockCategory({
          children: [
            createMockCategory({
              id: 'cat-uuid-002',
              name: 'Sub-cat',
              parentId: 'cat-uuid-001',
            }),
          ],
        }),
      ];

      repo.findTree.mockResolvedValue(tree);

      const result = await service.findTree();

      expect(result).toHaveLength(1);
      expect(result[0]!.children).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update category fields', async () => {
      const existing = createMockCategory();
      const updated = createMockCategory({ name: 'Normativa Actualizada' });

      repo.findById.mockResolvedValue(existing);
      repo.findByName.mockResolvedValue(null);
      repo.update.mockResolvedValue(updated);

      const result = await service.update('cat-uuid-001', {
        name: 'Normativa Actualizada',
      });

      expect(result.name).toBe('Normativa Actualizada');
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a category', async () => {
      repo.findById.mockResolvedValue(createMockCategory());
      repo.softDelete.mockResolvedValue(undefined);

      await service.softDelete('cat-uuid-001');

      expect(repo.softDelete).toHaveBeenCalledWith('cat-uuid-001');
    });
  });
});
