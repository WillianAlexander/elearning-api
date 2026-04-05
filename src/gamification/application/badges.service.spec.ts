import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import type { TestingModule } from '@nestjs/testing';

import { ENROLLMENT_STATUS } from '@lms/shared';
import { BadgesService } from './badges.service';
import { BadgeDefinitionRepository } from '../infrastructure/badge-definition.repository';
import { UserBadgeRepository } from '../infrastructure/user-badge.repository';
import { Enrollment } from '../../enrollments/domain/entities/enrollment.entity';
import { DailyActivitySummary } from '../../engagement/domain/entities/daily-activity-summary.entity';

import type { BadgeDefinition } from '../domain/entities/badge-definition.entity';
import type { UserBadge } from '../domain/entities/user-badge.entity';

const createMockBadgeDefinition = (
  overrides: Partial<BadgeDefinition> = {},
): BadgeDefinition =>
  ({
    id: 'badge-def-001',
    name: 'First Course',
    description: 'Complete your first course',
    icon: 'emoji_events',
    criteria: { type: 'course_completed' },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as BadgeDefinition;

const createMockUserBadge = (overrides: Partial<UserBadge> = {}): UserBadge =>
  ({
    id: 'user-badge-001',
    userId: 'user-001',
    badgeDefinitionId: 'badge-def-001',
    earnedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as UserBadge;

describe('BadgesService', () => {
  let service: BadgesService;
  let badgeDefRepository: jest.Mocked<BadgeDefinitionRepository>;
  let userBadgeRepository: jest.Mocked<UserBadgeRepository>;
  let enrollmentRepository: {
    count: jest.Mock;
    manager: { query: jest.Mock };
  };
  let activityRepository: {
    find: jest.Mock;
  };

  beforeEach(async () => {
    badgeDefRepository = {
      findAllActive: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<BadgeDefinitionRepository>;

    userBadgeRepository = {
      findByUser: jest.fn(),
      findByUserAndBadge: jest.fn(),
      create: jest.fn(),
      countByUser: jest.fn(),
    } as unknown as jest.Mocked<UserBadgeRepository>;

    enrollmentRepository = {
      count: jest.fn(),
      manager: { query: jest.fn() },
    };

    activityRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgesService,
        {
          provide: BadgeDefinitionRepository,
          useValue: badgeDefRepository,
        },
        {
          provide: UserBadgeRepository,
          useValue: userBadgeRepository,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: enrollmentRepository,
        },
        {
          provide: getRepositoryToken(DailyActivitySummary),
          useValue: activityRepository,
        },
      ],
    }).compile();

    service = module.get<BadgesService>(BadgesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('evaluateBadges', () => {
    it('should award course_completed badge when user has completed courses', async () => {
      const definition = createMockBadgeDefinition();
      const newBadge = createMockUserBadge();

      badgeDefRepository.findAllActive.mockResolvedValue([definition]);
      userBadgeRepository.findByUserAndBadge.mockResolvedValue(null);
      enrollmentRepository.count.mockResolvedValue(1);
      userBadgeRepository.create.mockResolvedValue(newBadge);

      const result = await service.evaluateBadges('user-001');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(newBadge);
      expect(userBadgeRepository.create).toHaveBeenCalledWith({
        userId: 'user-001',
        badgeDefinitionId: 'badge-def-001',
      });
      expect(enrollmentRepository.count).toHaveBeenCalledWith({
        where: { userId: 'user-001', status: ENROLLMENT_STATUS.COMPLETED },
      });
    });

    it('should NOT award badge if criteria not met', async () => {
      const definition = createMockBadgeDefinition();

      badgeDefRepository.findAllActive.mockResolvedValue([definition]);
      userBadgeRepository.findByUserAndBadge.mockResolvedValue(null);
      // No completed courses
      enrollmentRepository.count.mockResolvedValue(0);

      const result = await service.evaluateBadges('user-001');

      expect(result).toHaveLength(0);
      expect(userBadgeRepository.create).not.toHaveBeenCalled();
    });

    it('should NOT re-award already earned badges', async () => {
      const definition = createMockBadgeDefinition();
      const existingBadge = createMockUserBadge();

      badgeDefRepository.findAllActive.mockResolvedValue([definition]);
      // Already earned
      userBadgeRepository.findByUserAndBadge.mockResolvedValue(existingBadge);

      const result = await service.evaluateBadges('user-001');

      expect(result).toHaveLength(0);
      expect(enrollmentRepository.count).not.toHaveBeenCalled();
      expect(userBadgeRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserBadges', () => {
    it('should return user earned badges', async () => {
      const badges = [createMockUserBadge()];
      userBadgeRepository.findByUser.mockResolvedValue(badges);

      const result = await service.getUserBadges('user-001');

      expect(result).toEqual(badges);
      expect(userBadgeRepository.findByUser).toHaveBeenCalledWith('user-001');
    });
  });

  describe('getAllDefinitions', () => {
    it('should return active badge definitions', async () => {
      const definitions = [createMockBadgeDefinition()];
      badgeDefRepository.findAllActive.mockResolvedValue(definitions);

      const result = await service.getAllDefinitions();

      expect(result).toEqual(definitions);
      expect(badgeDefRepository.findAllActive).toHaveBeenCalled();
    });
  });
});
