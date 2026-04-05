import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';

import { CategoryRepository } from '../infrastructure/category.repository';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import type { Category } from '../domain/entities/category.entity';

/**
 * Service for category management.
 * Supports nested tree structure with parent/children.
 */
@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(
        `Category with name "${dto.name}" already exists`,
      );
    }

    if (dto.parentId) {
      const parent = await this.categoryRepository.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException(
          `Parent category with id ${dto.parentId} not found`,
        );
      }
    }

    const category = await this.categoryRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      parentId: dto.parentId ?? null,
    });

    this.logger.log(`Created category: ${category.name}`);
    return category;
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async findTree(): Promise<Category[]> {
    return this.categoryRepository.findTree();
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoryRepository.findByName(dto.name);
      if (existing) {
        throw new ConflictException(
          `Category with name "${dto.name}" already exists`,
        );
      }
    }

    if (dto.parentId) {
      const parent = await this.categoryRepository.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException(
          `Parent category with id ${dto.parentId} not found`,
        );
      }
    }

    const updated = await this.categoryRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.parentId !== undefined && { parentId: dto.parentId }),
    });

    if (!updated) {
      throw new NotFoundException(
        `Category with id ${id} not found after update`,
      );
    }

    this.logger.log(`Updated category: ${updated.name}`);
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.categoryRepository.softDelete(id);
    this.logger.log(`Soft-deleted category: ${id}`);
  }
}
